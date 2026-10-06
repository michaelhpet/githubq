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
import type { YearOwnership } from "@/lib/api/get-contributions";

function OwnershipTooltip({
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
			<p className="font-medium">{String(label)}</p>
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

export function YearOwnershipChart({ data }: { data: YearOwnership[] }) {
	if (data.every((row) => row.own + row.external === 0)) {
		return (
			<p className="text-sm text-dim">
				No contributions by repository in the past year.
			</p>
		);
	}
	return (
		<div className="h-64 w-full text-dim">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					layout="vertical"
					margin={{ top: 0, right: 8, bottom: 0, left: 8 }}
				>
					<CartesianGrid
						stroke="currentColor"
						strokeOpacity={0.15}
						vertical={false}
					/>
					<XAxis
						type="number"
						tick={{ fill: "currentColor", fontSize: 12 }}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						type="category"
						dataKey="type"
						tick={{ fill: "currentColor", fontSize: 12 }}
						tickLine={false}
						axisLine={false}
						width={105}
					/>
					<Tooltip
						cursor={{ fill: "currentColor", fillOpacity: 0.1 }}
						content={<OwnershipTooltip />}
					/>
					<Legend wrapperStyle={{ fontSize: 12 }} />
					<Bar
						dataKey="own"
						name="Own repositories"
						stackId="ownership"
						fill="#0c8ce9"
						radius={[4, 0, 0, 4]}
					/>
					<Bar
						dataKey="external"
						name="External repositories"
						stackId="ownership"
						fill="#8b949e"
						radius={[0, 4, 4, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
