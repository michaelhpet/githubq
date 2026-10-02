import type { ActivityPatterns } from "@/lib/activity/stats";

function Highlight({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-1 rounded-lg border-2 border-stroke bg-background p-3">
			<p className="text-sm text-dim">{label}</p>
			<p className="text-xl font-bold">{value}</p>
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
			</div>
			<p className="text-xs text-dim">Times shown in your local timezone.</p>
		</div>
	);
}
