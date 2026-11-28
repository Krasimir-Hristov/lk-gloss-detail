/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");
const MAX_LINES = 300;

const NEXT_RESERVED_TSX = new Set([
	"page.tsx",
	"layout.tsx",
	"loading.tsx",
	"error.tsx",
	"global-error.tsx",
	"not-found.tsx",
	"template.tsx",
	"default.tsx",
	"icon.tsx",
	"apple-icon.tsx",
	"opengraph-image.tsx",
	"twitter-image.tsx",
]);

const NEXT_RESERVED_TS = new Set([
	"index.ts",
	"server.ts",
	"route.ts",
	"proxy.ts",
	"request.ts",
	"routing.ts",
	"manifest.ts",
	"robots.ts",
	"sitemap.ts",
]);

// Existing legacy files exceeding 300 lines prior to adopting the architecture gate.
// Remove entries as each feature is refactored (e.g. assessmentAnalysisGraph.ts in Phase B).
const LEGACY_LINE_LIMIT_ALLOWLIST = new Set([
	"src/app/[locale]/privacy/page.tsx",
]);

const LEGACY_ARROW_COMPONENT_ALLOWLIST = new Set([]);

const errors = [];

const addError = (filePath, message) => {
	const rel = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
	errors.push(`[ARCH] ${rel}: ${message}`);
};

const walkFiles = (dir, collected = []) => {
	if (!fs.existsSync(dir)) return collected;
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name === "node_modules" || entry.name === ".next") continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkFiles(fullPath, collected);
		} else {
			collected.push(fullPath);
		}
	}
	return collected;
};

const checkNoMiddleware = () => {
	const forbiddenPaths = [
		path.join(ROOT_DIR, "middleware.ts"),
		path.join(ROOT_DIR, "middleware.js"),
		path.join(SRC_DIR, "middleware.ts"),
		path.join(SRC_DIR, "middleware.js"),
	];
	for (const filePath of forbiddenPaths) {
		if (fs.existsSync(filePath)) {
			addError(filePath, "middleware.ts/js is strictly forbidden. Use src/proxy.ts instead.");
		}
	}
};

const checkFileNaming = (filePath, relPath) => {
	const baseName = path.basename(filePath);
	const inAppDir = relPath.startsWith("src/app/");

	if (baseName.endsWith(".tsx")) {
		if (inAppDir && NEXT_RESERVED_TSX.has(baseName)) return;
		const isPascalCase = /^[A-Z][A-Za-z0-9]*(\.test)?\.tsx$/.test(baseName);
		if (!isPascalCase) {
			addError(filePath, `React UI component file "${baseName}" must use PascalCase.tsx.`);
		}
		return;
	}

	if (baseName.endsWith(".ts") && !baseName.endsWith(".d.ts")) {
		if (NEXT_RESERVED_TS.has(baseName)) return;
		const isCamelCase = /^[a-z][A-Za-z0-9]*(\.test)?\.ts$/.test(baseName);
		if (!isCamelCase) {
			addError(
				filePath,
				`Logic/helper file "${baseName}" must use camelCase.ts (or camelCase.test.ts).`,
			);
		}
	}
};

const checkLineLimit = (filePath, relPath, content) => {
	if (LEGACY_LINE_LIMIT_ALLOWLIST.has(relPath)) return;
	const lines = content.split(/\r?\n/);
	const lineCount =
		lines.length > 0 && lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
	if (lineCount > MAX_LINES) {
		addError(
			filePath,
			`File has ${lineCount} lines (limit is ${MAX_LINES}). Split into smaller modules.`,
		);
	}
};

const checkArrowComponents = (filePath, relPath, content) => {
	if (!filePath.endsWith(".tsx")) return;
	if (LEGACY_ARROW_COMPONENT_ALLOWLIST.has(relPath)) return;
	const functionComponentPattern =
		/^\s*(?:(?:export\s+default\s+|export\s+)?(?:async\s+)?function\s+[A-Z][A-Za-z0-9_]*|export\s+default\s+(?:async\s+)?function\s*\()/m;
	if (functionComponentPattern.test(content)) {
		addError(
			filePath,
			'React components must be defined using Arrow Functions (not the "function" keyword).',
		);
	}
};

const checkTailwindV4Gradients = (filePath, content) => {
	if (/\bbg-gradient-to-(?:t|tr|r|br|b|bl|l|tl)\b/.test(content)) {
		addError(
			filePath,
			'Legacy Tailwind v3 gradient "bg-gradient-to-*" detected. Use Tailwind v4 "bg-linear-to-*".',
		);
	}
};

const stripLineAndBlockComments = (source) =>
	source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const extractModuleSpecifiers = (content) => {
	const clean = stripLineAndBlockComments(content);
	const specifiers = [];
	const patterns = [
		/(?:^|;)\s*(?:import|export)\s+(?:type\s+)?[^;]*?\bfrom\s*['"]([^'"]+)['"]/gm,
		/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
		/^\s*import\s+['"]([^'"]+)['"]/gm,
	];
	for (const regex of patterns) {
		let match = regex.exec(clean);
		while (match !== null) {
			specifiers.push(match[1]);
			match = regex.exec(clean);
		}
	}
	return specifiers;
};

const checkAliasPathTraversal = (filePath, content) => {
	const specifiers = extractModuleSpecifiers(content);
	for (const specifier of specifiers) {
		if (
			specifier.startsWith("@/") &&
			/(?:^|\/)\.\.(?:\/|$)/.test(specifier.slice(2).replace(/\\/g, "/"))
		) {
			addError(
				filePath,
				`Path traversal ".." inside "@/" alias "${specifier}" is forbidden. Use a clean canonical import path.`,
			);
		}
	}
};

const main = () => {
	checkNoMiddleware();
	const files = walkFiles(SRC_DIR);

	for (const filePath of files) {
		const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
		const isCodeFile = /\.(ts|tsx|css)$/.test(filePath);
		if (!isCodeFile) continue;

		const content = fs.readFileSync(filePath, "utf8");

		checkLineLimit(filePath, relPath, content);

		if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
			checkFileNaming(filePath, relPath);
			checkArrowComponents(filePath, relPath, content);
			checkAliasPathTraversal(filePath, content);
		}

		checkTailwindV4Gradients(filePath, content);
	}

	if (errors.length > 0) {
		console.error("\n❌ LK Gloss & Detail Architecture Verification Failed:\n");
		for (const err of errors) {
			console.error(`  - ${err}`);
		}
		console.error(`\nTotal violations: ${errors.length}\n`);
		process.exit(1);
	}

	console.log(
		`✅ LK Gloss & Detail Architecture Verification Passed (${files.length} files scanned, 0 violations).`,
	);
};

main();
