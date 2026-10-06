import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { WeeklyOwnership } from "@/lib/activity/stats";

function WeeklyTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: { value?: number | string; name?: string }[];
	label?: string;
}) {
	if (!active || !payload?.length) return null;
	const total = payload.reduce(
		(sum, entry) => sum + (typeof entry.value === "number" ? entry.value : 0),
		0,
	);
	return (
		<div className="rounded-lg border border-stroke bg-paper px-2 py-1 text-xs text-foreground">
			<p className="font-medium">Week of {String(label)}</p>
			{[...payload].reverse().map((entry) => (
				<p key={entry.name} className="text-dim">
					{entry.name}:{" "}
					{typeof entry.value === "number"
						? entry.value.toLocaleString()
						: entry.value}
				</p>
			))}
			<p className="font-medium">Total: {total.toLocaleString()}</p>
		</div>
	);
}

export function WeeklyOwnershipChart({ data }: { data: WeeklyOwnership[] }) {
	if (data.every((week) => week.own + week.external === 0)) {
		return <p className="text-xs text-dim">No activity in recent weeks.</p>;
	}
	return (
		<div className="min-h-56 w-full flex-1 text-dim">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} barCategoryGap="15%">
					<CartesianGrid
						stroke="currentColor"
						strokeOpacity={0.15}
						vertical={false}
					/>
					<YAxis hide />
					<XAxis
						dataKey="week"
						tick={{ fill: "currentColor", fontSize: 11 }}
						tickLine={false}
						axisLine={false}
						interval="preserveStartEnd"
						minTickGap={8}
					/>
					<Tooltip
						cursor={{ fill: "currentColor", fillOpacity: 0.1 }}
						content={<WeeklyTooltip />}
					/>
					<Legend wrapperStyle={{ fontSize: 12 }} />
					<Bar
						dataKey="own"
						name="Own repositories"
						fill="#0c8ce9"
						radius={[3, 3, 0, 0]}
					/>
					<Bar
						dataKey="external"
						name="External repositories"
						fill="#8b949e"
						radius={[3, 3, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
