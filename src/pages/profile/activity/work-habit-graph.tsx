import {
	CartesianGrid,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
	ZAxis,
} from "recharts";
import type { WorkHabitCell } from "@/lib/activity/stats";
import { formatHour } from "@/lib/activity/stats";

function PunchcardTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: { payload?: WorkHabitCell }[];
}) {
	const datum = payload?.[0]?.payload;
	if (!active || !datum) return null;
	return (
		<div className="rounded-lg border border-stroke bg-paper px-2 py-1 text-xs text-foreground">
			<p className="font-medium">
				{datum.day} · {datum.hourLabel}
			</p>
			<p className="text-dim">
				{datum.count} event{datum.count === 1 ? "" : "s"}
			</p>
		</div>
	);
}

export function WorkHabitGraph({ cells }: { cells: WorkHabitCell[] }) {
	if (cells.every((cell) => cell.count === 0)) {
		return <p className="text-sm text-dim">No activity in this window.</p>;
	}
	return (
		<div className="flex flex-col gap-2">
			<div className="h-80 w-full text-dim">
				<ResponsiveContainer width="100%" height="100%">
					<ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
						<CartesianGrid stroke="currentColor" strokeOpacity={0.15} />
						<XAxis
							dataKey="day"
							type="category"
							allowDuplicatedCategory={false}
							tick={{ fill: "currentColor", fontSize: 12 }}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							dataKey="hour"
							type="number"
							domain={[0, 23]}
							reversed
							tickFormatter={(hour) => formatHour(hour)}
							tick={{ fill: "currentColor", fontSize: 11 }}
							tickLine={false}
							axisLine={false}
							width={55}
						/>
						<ZAxis dataKey="count" type="number" range={[0, 500]} />
						<Tooltip
							cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
							content={<PunchcardTooltip />}
						/>
						<Scatter data={cells} fill="#0c8ce9" />
					</ScatterChart>
				</ResponsiveContainer>
			</div>
			<p className="text-xs text-dim">
				Bubble size shows events · times in your local timezone.
			</p>
		</div>
	);
}
