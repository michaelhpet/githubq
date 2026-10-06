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
