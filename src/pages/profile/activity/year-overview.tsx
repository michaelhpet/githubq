import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	YAxis,
} from "recharts";
import { formatDay } from "@/lib/format";

function YearTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: { payload?: { range: string; count: number } }[];
}) {
	const datum = payload?.[0]?.payload;
	if (!active || !datum) return null;
	return (
		<div className="rounded-lg border border-stroke bg-paper px-2 py-1 text-xs text-foreground">
			<p className="font-medium">{datum.range}</p>
			<p className="text-dim">
				{datum.count} commit{datum.count === 1 ? "" : "s"}
			</p>
		</div>
	);
}

export function YearOverview({ series }: { series: number[] }) {
	const total = series.reduce((sum, count) => sum + count, 0);
	if (total === 0) {
		return (
			<p className="text-sm text-dim">
				No commits to these repositories in the past year.
			</p>
		);
	}
	const now = Date.now();
	const weeks = series.map((count, i) => {
		const start = now - (51 - i) * 7 * 24 * 60 * 60 * 1000;
		const end = start + 6 * 24 * 60 * 60 * 1000;
		return {
			week: new Date(start).toISOString().slice(0, 10),
			range: `${formatDay(start)} – ${formatDay(end)}`,
			count,
		};
	});
	return (
		<div className="flex flex-col gap-2">
			<div className="h-36 w-full text-dim">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={weeks} barCategoryGap="25%">
						<CartesianGrid
							stroke="currentColor"
							strokeOpacity={0.15}
							vertical={false}
						/>
						<YAxis hide domain={[0, "dataMax"]} />
						<Tooltip
							cursor={{ fill: "currentColor", fillOpacity: 0.15 }}
							content={<YearTooltip />}
						/>
						<Bar dataKey="count" radius={[2, 2, 0, 0]}>
							{weeks.map((week) => (
								<Cell
									key={week.week}
									fill={week.count > 0 ? "#0c8ce9" : "#8b949e"}
									fillOpacity={week.count > 0 ? 1 : 0.35}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>
			<div className="flex items-center justify-between text-xs text-dim">
				<span>52 weeks ago</span>
				<span>{total.toLocaleString()} commits</span>
				<span>now</span>
			</div>
		</div>
	);
}
