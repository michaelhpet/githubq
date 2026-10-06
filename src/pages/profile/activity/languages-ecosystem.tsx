import {
	PolarAngleAxis,
	PolarGrid,
	Radar,
	RadarChart,
	ResponsiveContainer,
	Tooltip,
	Treemap,
} from "recharts";
import type { EcosystemSlice, LanguageShare } from "@/lib/repos/stats";

const CELL_COLORS = ["#0c8ce9", "#8b949e", "#30a14e", "#e3b341", "#a371f7"];
const OTHER_COLOR = "#6e7681";

const TOP_CELL_COUNT = 8;

interface LanguageCell {
	name: string;
	size: number;
	percent: number;
	fill: string;
	[key: string]: string | number;
}

function formatBytes(bytes: number): string {
	if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${bytes} B`;
}

function TreemapTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: { payload?: LanguageCell }[];
}) {
	const datum = payload?.[0]?.payload;
	if (!active || !datum) return null;
	return (
		<div className="rounded-lg border border-stroke bg-paper px-2 py-1 text-xs text-foreground">
			<p className="font-medium">{datum.name}</p>
			<p className="text-dim">
				{datum.percent.toFixed(1)}% · {formatBytes(datum.size)}
			</p>
		</div>
	);
}

interface TreemapContentProps {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	depth?: number;
	name?: string;
	index?: number;
}

function LanguagesTreemap({ shares }: { shares: LanguageShare[] }) {
	const top = shares.slice(0, TOP_CELL_COUNT);
	const rest = shares.slice(TOP_CELL_COUNT);
	const restBytes = rest.reduce((sum, share) => sum + share.bytes, 0);
	const restPercent = rest.reduce((sum, share) => sum + share.percent, 0);
	const cells: LanguageCell[] = [
		...top.map((share, i) => ({
			name: share.language,
			size: share.bytes,
			percent: share.percent,
			fill: CELL_COLORS[i % CELL_COLORS.length],
		})),
		...(rest.length > 0
			? [
					{
						name: "Other",
						size: restBytes,
						percent: restPercent,
						fill: OTHER_COLOR,
					},
				]
			: []),
	];
	const fillByName = new Map(cells.map((cell) => [cell.name, cell.fill]));
	const percentByName = new Map(cells.map((cell) => [cell.name, cell.percent]));

	function content(props: TreemapContentProps) {
		const { x = 0, y = 0, width = 0, height = 0, depth, name } = props;
		const showLabel = depth === 1 && width > 64 && height > 28;
		return (
			<g>
				<rect
					x={x}
					y={y}
					width={width}
					height={height}
					rx={4}
					style={{
						fill: depth === 1 ? (fillByName.get(name ?? "") ?? OTHER_COLOR) : "transparent",
						stroke: "rgb(var(--paper))",
						strokeWidth: 2,
					}}
				/>
				{showLabel && (
					<text
						x={x + width / 2}
						y={y + height / 2}
						textAnchor="middle"
						dominantBaseline="middle"
						fill="#fff"
						fontSize={12}
						fontWeight={500}
					>
						{name} {(percentByName.get(name ?? "") ?? 0).toFixed(1)}%
					</text>
				)}
			</g>
		);
	}

	return (
		<div className="h-64 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<Treemap data={cells} dataKey="size" content={content}>
					<Tooltip content={<TreemapTooltip />} />
				</Treemap>
			</ResponsiveContainer>
		</div>
	);
}

export function LanguagesEcosystem({
	shares,
	ecosystem,
}: {
	shares: LanguageShare[];
	ecosystem: EcosystemSlice[];
}) {
	if (shares.length === 0) return null;
	const hasEcosystem = ecosystem.some((slice) => slice.value > 0);
	return (
		<div
			className={`grid grid-cols-1 items-start gap-4 ${hasEcosystem ? "md:grid-cols-2" : ""}`}
		>
			<div className="flex flex-col gap-2">
				<p className="text-sm font-medium">Languages</p>
				<p className="text-xs text-dim">By bytes across top repositories.</p>
				<LanguagesTreemap shares={shares} />
			</div>
			{hasEcosystem && (
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">Ecosystem balance</p>
					<p className="text-xs text-dim">
						Top repositories per area, from repo topics and languages.
					</p>
					<div className="h-64 w-full text-dim">
						<ResponsiveContainer width="100%" height="100%">
							<RadarChart data={ecosystem} outerRadius="70%">
								<PolarGrid stroke="currentColor" />
								<PolarAngleAxis
									dataKey="subject"
									tick={{ fill: "currentColor", fontSize: 12 }}
								/>
								<Tooltip
									cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
									contentStyle={{
										backgroundColor: "rgb(var(--paper))",
										border: "1px solid rgb(var(--stroke))",
										borderRadius: 8,
										fontSize: 12,
									}}
									formatter={(value) => [
										`${typeof value === "number" ? value : 0} repos`,
										"",
									]}
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
				</div>
			)}
		</div>
	);
}
