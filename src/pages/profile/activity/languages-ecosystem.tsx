import {
	PolarAngleAxis,
	PolarGrid,
	Radar,
	RadarChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import type {
	EcosystemSlice,
	LanguageInsights,
	LanguageShare,
} from "@/lib/repos/stats";

const STRIP_COLORS = ["#0c8ce9", "#8b949e", "#30a14e", "#e3b341", "#a371f7"];

function LanguageStrip({ shares }: { shares: LanguageShare[] }) {
	const top = shares.slice(0, 5);
	const rest = shares.slice(5);
	const restPercent = rest.reduce((sum, share) => sum + share.percent, 0);
	const segments = [
		...top.map((share, i) => ({
			key: share.language,
			label: `${share.language} ${share.percent.toFixed(1)}%`,
			percent: share.percent,
			color: STRIP_COLORS[i % STRIP_COLORS.length],
		})),
		...(rest.length > 0
			? [
					{
						key: "Other",
						label: `Other ${restPercent.toFixed(1)}%`,
						percent: restPercent,
						color: "#6e7681",
					},
				]
			: []),
	];
	return (
		<div className="flex flex-col gap-2">
			<div className="flex h-3 overflow-hidden rounded-full">
				{segments.map((segment) => (
					<div
						key={segment.key}
						title={segment.label}
						style={{
							width: `${segment.percent}%`,
							backgroundColor: segment.color,
						}}
					/>
				))}
			</div>
			<ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-dim">
				{segments.map((segment) => (
					<li key={segment.key} className="flex items-center gap-1">
						<span
							aria-hidden="true"
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: segment.color }}
						/>
						{segment.label}
					</li>
				))}
			</ul>
		</div>
	);
}

function Insight({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-1 rounded-lg border border-stroke bg-background p-3">
			<p className="text-sm text-dim">{label}</p>
			<p className="truncate text-xl font-bold" title={value}>
				{value}
			</p>
		</div>
	);
}

function formatMonthYear(iso: string): string {
	return new Date(iso).toLocaleDateString("default", {
		year: "numeric",
		month: "short",
	});
}

export function LanguagesEcosystem({
	shares,
	ecosystem,
	insights,
}: {
	shares: LanguageShare[];
	ecosystem: EcosystemSlice[];
	insights: LanguageInsights;
}) {
	if (shares.length === 0) return null;
	return (
		<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">Languages</p>
					<LanguageStrip shares={shares} />
					<p className="text-xs text-dim">By bytes across top repositories.</p>
				</div>
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-3">
					<Insight
						label="Primary language"
						value={insights.primary ? insights.primary.language : "—"}
					/>
					<Insight label="Languages used" value={`${insights.count}`} />
					<Insight
						label="Most starred"
						value={
							insights.mostStarred
								? `${insights.mostStarred.language} · ${insights.mostStarred.stars.toLocaleString()}★`
								: "—"
						}
					/>
					<Insight
						label="Most recent"
						value={
							insights.mostRecent
								? `${insights.mostRecent.language} · ${formatMonthYear(insights.mostRecent.pushedAt)}`
								: "—"
						}
					/>
				</div>
			</div>
			{ecosystem.some((slice) => slice.value > 0) && (
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">Ecosystem balance</p>
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
					<p className="text-xs text-dim">
						Top repositories per area, from repo topics and languages.
					</p>
				</div>
			)}
		</div>
	);
}
