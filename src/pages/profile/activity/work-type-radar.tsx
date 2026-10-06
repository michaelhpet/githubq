import {
	PolarAngleAxis,
	PolarGrid,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from "recharts";
import {
	getWorkTypeSummary,
	WORK_TYPE_ORDER,
	type BreakdownPoint,
	type WorkTypeOwnership,
} from "@/lib/activity/stats";

export function WorkTypeRadar({
	breakdown,
	ownership,
}: {
	breakdown: BreakdownPoint[];
	ownership: WorkTypeOwnership[];
}) {
	// The radar always shows every axis (zero included) so it keeps its
	// full shape even when there is no activity in the window.
	const data =
		breakdown.length > 0
			? breakdown
			: WORK_TYPE_ORDER.map((type) => ({ type, value: 0 }));
	const summary = getWorkTypeSummary(breakdown);
	const hasOwnership = ownership.some(
		(entry) => entry.own + entry.external > 0,
	);
	return (
		<div className="flex flex-col gap-4">
			{summary && (
				<p className="text-sm">
					<span className="font-bold">{summary.archetype}</span>{" "}
					<span className="text-dim">
						· {summary.topPercent}% of activity is {summary.topType}
					</span>
				</p>
			)}
			<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
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
				<div className="flex flex-col gap-4">
					{hasOwnership && (
						<div className="flex flex-col gap-2">
							<p className="text-sm font-medium">Own vs external</p>
							<p className="text-xs text-dim">
								Share of each work type in own vs others' repositories.
							</p>
							{ownership.map((entry) => {
								const total = entry.own + entry.external;
								const ownPercent =
									total > 0 ? (entry.own / total) * 100 : 50;
								return (
									<div key={entry.type} className="flex flex-col gap-1">
										<div className="flex items-center justify-between gap-2 text-xs">
											<span className="font-medium">{entry.type}</span>
											<span className="text-dim">
												{entry.own.toLocaleString()} own ·{" "}
												{entry.external.toLocaleString()} ext
											</span>
										</div>
										<div className="flex h-2 overflow-hidden rounded-full">
											<div
												title={`${entry.type} own repositories`}
												style={{
													width: `${ownPercent}%`,
													backgroundColor: "#0c8ce9",
												}}
											/>
											<div
												title={`${entry.type} external repositories`}
												style={{
													width: `${100 - ownPercent}%`,
													backgroundColor: "#8b949e",
												}}
											/>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
