import type { ActivityPatterns } from "@/lib/activity/stats";

function Highlight({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex min-w-0 flex-col gap-1 rounded-lg border-2 border-stroke bg-background p-3">
			<p className="text-sm text-dim">{label}</p>
			<p className="truncate text-xl font-bold" title={value}>
				{value}
			</p>
		</div>
	);
}

export function ActivityHighlights({
	patterns,
}: {
	patterns: ActivityPatterns;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
				<Highlight label="Busiest day" value={patterns.busiestDay ?? "—"} />
				<Highlight label="Peak hours" value={patterns.peakHours ?? "—"} />
				<Highlight label="Working style" value={patterns.workingStyle} />
				<Highlight
					label="Active days"
					value={`${patterns.activeDays} day${patterns.activeDays === 1 ? "" : "s"}`}
				/>
				<Highlight
					label="Longest streak"
					value={`${patterns.longestStreak} day${patterns.longestStreak === 1 ? "" : "s"}`}
				/>
				<Highlight label="Top repo" value={patterns.topRepo ?? "—"} />
			</div>
			<p className="text-xs text-dim">Times shown in your local timezone.</p>
		</div>
	);
}
