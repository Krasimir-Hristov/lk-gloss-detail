"use client";

import React, { useEffect } from "react";

interface GlobalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

const GlobalError: React.FC<GlobalErrorProps> = ({ error, reset }) => {
	useEffect(() => {
		console.error("[GlobalError Root Boundary caught error]:", error);
	}, [error]);

	return (
		<html lang="de" className="h-full bg-[#131313] text-[#e5e2e1]">
			<body className="flex min-h-full items-center justify-center p-4 font-sans">
				<div className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-2xl border border-[#7b2dff]/30 bg-[#201f1f] p-8 text-center shadow-2xl">
					<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
						<svg
							className="h-8 w-8"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>

					<h1 className="text-2xl font-bold text-white">Technisches Problem</h1>

					<p className="text-sm leading-relaxed text-[#ccc3d9]">
						Ein kritischer technischer Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
					</p>

					<button
						type="button"
						onClick={reset}
						className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#7b2dff] to-[#b303f2] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
					>
						Seite neu laden
					</button>
				</div>
			</body>
		</html>
	);
};

export default GlobalError;
