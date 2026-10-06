import { useState } from "react";
import type { ContributionDay } from "@/lib/activity/stats";
import { formatDay } from "@/lib/format";

const LEVELS = [
	"bg-[rgb(var(--heat-0))]",
	"bg-[rgb(var(--heat-1))]",
	"bg-[rgb(var(--heat-2))]",
	"bg-[rgb(var(--heat-3))]",
	"bg-[rgb(var(--heat-4))]",
];

const MIN_LABEL_WEEKS = 3;

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

interface Tip {
	date: string;
	count: number;
	x: number;
	y: number;
}

export function ContributionMatrix({ days }: { days: ContributionDay[] }) {
	const [tip, setTip] = useState<Tip | null>(null);
	const counts = new Map(days.map((day) => [day.date, day.count]));
	const max = days.reduce((top, day) => Math.max(top, day.count), 0);

	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);
	const end = addDays(today, 6 - today.getUTCDay());
	const start = addDays(end, -(52 * 7 - 1));

	const weeks: string[][] = [];
	let cursor = start;
	while (cursor <= end) {
		const week: string[] = [];
		for (let i = 0; i < 7; i++) {
			week.push(toKey(cursor));
			cursor = addDays(cursor, 1);
		}
		weeks.push(week);
	}

	const weekMonths = weeks.map((week) =>
		monthLabel(new Date(`${week[0]}T00:00:00Z`)),
	);
	const labels = weekMonths.map((month, i) => {
		if (i > 0 && weekMonths[i - 1] === month) return "";
		const rest = weekMonths.slice(i).findIndex((m) => m !== month);
		const span = rest === -1 ? weekMonths.length - i : rest;
		return span >= MIN_LABEL_WEEKS ? month : "";
	});

	return (
		<div className="flex flex-col gap-2 overflow-x-auto">
			<div className="mx-auto flex w-fit flex-col gap-[3px]">
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
								return (
									<span
										key={date}
										role="img"
										aria-label={`${count} contribution${count === 1 ? "" : "s"} on ${date}`}
										onMouseEnter={(e) =>
											setTip({ date, count, x: e.clientX, y: e.clientY })
										}
										onMouseMove={(e) =>
											setTip({ date, count, x: e.clientX, y: e.clientY })
										}
										onMouseLeave={() => setTip(null)}
										className={`h-3 w-3 rounded-[3px] ${LEVELS[levelFor(count, max)]}`}
									/>
								);
							})}
						</div>
					))}
				</div>
				<div className="mt-2 flex items-center justify-end gap-1 text-xs text-dim">
					<span>Less</span>
					{LEVELS.map((level) => (
						<span key={level} className={`h-3 w-3 rounded-[3px] ${level}`} />
					))}
					<span>More</span>
				</div>
			</div>
			{tip && (
				<div
					className="pointer-events-none fixed z-50 rounded-lg border border-stroke bg-paper px-2 py-1 text-xs shadow"
					style={{
						left: Math.min(tip.x + 12, window.innerWidth - 180),
						top: tip.y + 14,
					}}
				>
					<p className="font-medium">
						{tip.count} contribution{tip.count === 1 ? "" : "s"}
					</p>
					<p className="text-dim">{formatDay(tip.date)}</p>
				</div>
			)}
		</div>
	);
}
