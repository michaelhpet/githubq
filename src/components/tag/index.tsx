import type { PropsWithChildren } from "react";

export function Tag(props: PropsWithChildren) {
	return (
		<span className="self-start flex items-center px-2 py-1 rounded-lg bg-paper text-sm text-dim">
			{props.children}
		</span>
	);
}
