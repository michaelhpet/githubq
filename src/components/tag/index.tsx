import type { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

interface TagProps extends PropsWithChildren {
	size?: "small" | "default";
	className?: string;
}

const baseStyles = "self-start flex items-center rounded-lg bg-paper text-dim";

const sizeStyles = {
	default: "px-2 py-1 text-sm",
	small: "px-1.5 py-0.5 text-xs",
} as const;

export function Tag({ size = "default", className, children }: TagProps) {
	return (
		<span className={twMerge(baseStyles, sizeStyles[size], className)}>
			{children}
		</span>
	);
}
