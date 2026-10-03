/**
 * Short calendar date, e.g. "Mar 3". Bare YYYY-MM-DD strings are read as
 * UTC so the displayed day never shifts with the viewer's timezone.
 */
export function formatDay(value: string | number | Date): string {
	const normalized =
		typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
			? `${value}T00:00:00Z`
			: value;
	return new Date(normalized).toLocaleDateString("default", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}
