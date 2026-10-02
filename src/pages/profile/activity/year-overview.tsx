export function YearOverview({ series }: { series: number[] }) {
	const max = Math.max(0, ...series);
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
		return { key: at.toISOString().slice(0, 10), count };
	});
	return (
		<div className="flex flex-col gap-2">
			<div className="flex h-24 items-end gap-[2px]">
				{weeks.map((week) => (
					<div
						key={week.key}
						title={`${week.count} commits · week of ${week.key}`}
						style={{
							height: `${max > 0 ? Math.max(4, (week.count / max) * 100) : 2}%`,
						}}
						className={`min-w-1 flex-1 rounded-[2px] ${week.count > 0 ? "bg-accent" : "bg-paper"}`}
					/>
				))}
			</div>
			<div className="flex items-center justify-between text-xs text-dim">
				<span>52 weeks ago</span>
				<span>{total.toLocaleString()} commits</span>
				<span>now</span>
			</div>
		</div>
	);
}
