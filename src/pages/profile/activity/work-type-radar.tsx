import {
	PolarAngleAxis,
	PolarGrid,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from "recharts";
import type { WorkTypeBreakdown } from "@/lib/activity/stats";
import type { LifetimeCounts } from "@/lib/api/search";

export function WorkTypeRadar({
	breakdown,
	lifetime,
}: {
	breakdown: WorkTypeBreakdown;
	lifetime: LifetimeCounts | null;
}) {
	const data = [
		{ type: "Commits", value: breakdown.commits, lifetime: lifetime?.commits },
		{
			type: "Pull requests",
			value: breakdown.pullRequests,
			lifetime: lifetime?.pullRequests,
		},
		{ type: "Reviews", value: breakdown.reviews, lifetime: lifetime?.reviews },
		{ type: "Issues", value: breakdown.issues, lifetime: lifetime?.issues },
	];
	if (data.every((point) => point.value === 0)) {
		return (
			<p className="text-sm text-dim">
				No commits, pull requests, reviews, or issues in this window.
			</p>
		);
	}
	return (
		<div className="flex flex-col gap-2">
			<div className="h-72 w-full text-dim">
				<ResponsiveContainer width="100%" height="100%">
					<RadarChart data={data} outerRadius="70%">
						<PolarGrid stroke="currentColor" />
						<PolarAngleAxis
							dataKey="type"
							tick={{ fill: "currentColor", fontSize: 12 }}
						/>
						<Radar
							dataKey="value"
							stroke="#0c8ce9"
							fill="#0c8ce9"
							fillOpacity={0.35}
						/>
					</RadarChart>
				</ResponsiveContainer>
			</div>
			{lifetime && (
				<ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim">
					{data.map((point) => (
						<li key={point.type}>
							{point.type}: {point.value} in window ·{" "}
							{(point.lifetime ?? 0).toLocaleString()} all-time
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
