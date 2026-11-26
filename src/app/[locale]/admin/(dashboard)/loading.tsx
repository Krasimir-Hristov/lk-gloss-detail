import React from "react";

const AdminDashboardLoading: React.FC = () => (
	<div className="animate-pulse space-y-8" aria-busy="true" aria-label="Loading admin content">
		{/* Header Skeleton */}
		<div className="space-y-3">
			<div className="h-8 w-56 rounded-lg bg-neutral-800/80" />
			<div className="h-4 w-80 max-w-full rounded-md bg-neutral-900" />
		</div>

		{/* 4 KPI Cards Skeleton */}
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{[0, 1, 2, 3].map((idx) => (
				<div
					key={idx}
					className="rounded-xl border border-neutral-800/80 bg-neutral-900/70 p-6 backdrop-blur-md"
				>
					<div className="flex items-start justify-between">
						<div className="space-y-3">
							<div className="h-3 w-24 rounded bg-neutral-800" />
							<div className="h-9 w-16 rounded bg-neutral-800/90" />
							<div className="h-3 w-32 rounded bg-neutral-800/60" />
						</div>
						<div className="h-10 w-10 rounded-lg bg-neutral-800/80" />
					</div>
				</div>
			))}
		</div>

		{/* Quick Actions Skeleton */}
		<div className="flex flex-wrap gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900/70 p-4">
			<div className="h-10 w-40 rounded-lg bg-neutral-800/80" />
			<div className="h-10 w-40 rounded-lg bg-neutral-800/80" />
		</div>

		{/* Content Widgets Skeleton */}
		<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
			{[0, 1].map((idx) => (
				<div
					key={idx}
					className="space-y-4 rounded-xl border border-neutral-800/80 bg-neutral-900/70 p-6"
				>
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-lg bg-neutral-800" />
						<div className="space-y-2">
							<div className="h-4 w-36 rounded bg-neutral-800" />
							<div className="h-3 w-48 rounded bg-neutral-800/60" />
						</div>
					</div>
					<div className="space-y-3 pt-2">
						{[0, 1, 2].map((row) => (
							<div
								key={row}
								className="h-16 rounded-lg border border-neutral-800/60 bg-neutral-950/80"
							/>
						))}
					</div>
				</div>
			))}
		</div>
	</div>
);

export default AdminDashboardLoading;
