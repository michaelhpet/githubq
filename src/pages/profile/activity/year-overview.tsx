import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function YearOverview({ series }: { series: number[] }) {
	const total = series.reduce((sum, count) => sum + count, 0);
	if (total === 0) {
		return (
			<p className="text-sm text-dim">
				No commits to these repositories in the past 52 weeks.
			</p>
		);
	}
	const now = Date.now();
	const weeks = series.map((count, i) => {
		const at = new Date(now - (51 - i) * 7 * 24 * 60 * 60 * 1000);
		return { week: at.toISOString().slice(0, 10), count };
	});
	return (
		<div className="flex flex-col gap-2">
			<div className="h-36 w-full text-dim">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={weeks} barCategoryGap="25%">
						<Tooltip
							cursor={{ fill: "currentColor", fillOpacity: 0.15 }}
							contentStyle={{
								backgroundColor: "rgb(var(--paper))",
								border: "1px solid rgb(var(--stroke))",
								borderRadius: 8,
								fontSize: 12,
							}}
							labelFormatter={(week) => `Week of ${String(week)}`}
							formatter={(count) => [
								`${typeof count === "number" ? count : 0} commits`,
								"",
							]}
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
