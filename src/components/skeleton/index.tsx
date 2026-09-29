import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

interface SkeletonProps {
	width?: CSSProperties["width"];
	height?: CSSProperties["height"];
	className?: string;
}

export function Skeleton({ width, height, className }: SkeletonProps) {
	return (
		<div
			aria-hidden="true"
			className={twMerge("animate-pulse rounded bg-stroke", className)}
			style={{ width, height }}
		/>
	);
}
