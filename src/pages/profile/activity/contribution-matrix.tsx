import type { ContributionDay } from "@/lib/activity/stats";

const LEVELS = [
	"bg-[#ebedf0] dark:bg-paper",
	"bg-[#9be9a8] dark:bg-[#0e4429]",
	"bg-[#40c463] dark:bg-[#006d32]",
	"bg-[#30a14e] dark:bg-[#26a641]",
	"bg-[#216e39] dark:bg-[#39d353]",
];

function levelFor(count: number, max: number): number {
	if (count === 0 || max === 0) return 0;
	const ratio = count / max;
	if (ratio < 0.25) return 1;
	if (ratio < 0.5) return 2;
	if (ratio < 0.75) return 3;
	return 4;
}

function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function toKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function monthLabel(date: Date): string {
	return date.toLocaleString("default", { month: "short", timeZone: "UTC" });
}

export function ContributionMatrix({ days }: { days: ContributionDay[] }) {
	const counts = new Map(days.map((day) => [day.date, day.count]));
	const max = days.reduce((top, day) => Math.max(top, day.count), 0);
	if (days.length === 0) return null;

	const first = new Date(`${days[0].date}T00:00:00Z`);
	const last = new Date(`${days[days.length - 1].date}T00:00:00Z`);
	const start = addDays(first, -first.getUTCDay());

	const weeks: string[][] = [];
	let cursor = start;
	while (cursor <= last) {
		const week: string[] = [];
		for (let i = 0; i < 7; i++) {
			week.push(toKey(cursor));
			cursor = addDays(cursor, 1);
		}
		weeks.push(week);
	}

	let seenMonth = "";
	const labels = weeks.map((week) => {
		const month = monthLabel(new Date(`${week[0]}T00:00:00Z`));
		if (month !== seenMonth) {
			seenMonth = month;
			return month;
		}
		return "";
	});

	return (
		<div className="flex flex-col gap-2 overflow-x-auto">
			<div className="flex gap-[3px] text-xs text-dim">
				<span className="w-8 shrink-0" />
				{labels.map((label, i) => (
					<span key={weeks[i][0]} className="w-3 shrink-0 overflow-visible">
						{label}
					</span>
				))}
			</div>
			<div className="flex gap-[3px]">
				<div className="grid grid-rows-7 gap-[3px] text-[10px] text-dim">
					{[
						{ day: "sun", char: "" },
						{ day: "mon", char: "M" },
						{ day: "tue", char: "" },
						{ day: "wed", char: "W" },
						{ day: "thu", char: "" },
						{ day: "fri", char: "F" },
						{ day: "sat", char: "" },
					].map(({ day, char }) => (
						<span key={day} className="flex h-3 w-8 items-center">
							{char}
						</span>
					))}
				</div>
				{weeks.map((week) => (
					<div key={week[0]} className="grid grid-rows-7 gap-[3px]">
						{week.map((date) => {
							const count = counts.get(date) ?? 0;
							const inRange =
								date >= days[0].date && date <= days[days.length - 1].date;
							return (
								<span
									key={date}
									title={`${count} contribution${count === 1 ? "" : "s"} on ${date}`}
									className={`h-3 w-3 rounded-[3px] ${inRange ? LEVELS[levelFor(count, max)] : "bg-transparent"}`}
								/>
							);
						})}
					</div>
				))}
			</div>
			<div className="flex items-center justify-end gap-1 text-xs text-dim">
				<span>Less</span>
				{LEVELS.map((level) => (
					<span key={level} className={`h-3 w-3 rounded-[3px] ${level}`} />
				))}
				<span>More</span>
			</div>
		</div>
	);
}
