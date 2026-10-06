import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<
	{ children: ReactNode },
	{ error: Error | null }
> {
	state = { error: null as Error | null };

	static getDerivedStateFromError(error: Error): { error: Error } {
		return { error };
	}

	componentDidCatch(error: Error): void {
		console.error("Uncaught app error", error);
	}

	render(): ReactNode {
		if (this.state.error) {
			return (
				<div className="flex min-h-[calc(100vh-128px)] flex-col items-center justify-center gap-2 p-4 text-center">
					<p className="text-2xl font-bold">Something went wrong</p>
					<p className="max-w-md text-sm text-dim">
						{this.state.error.message || "An unexpected error occurred."}
					</p>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => this.setState({ error: null })}
							className="text-sm font-medium underline hover:no-underline"
						>
							Try again
						</button>
						<a href="/" className="text-sm font-medium hover:underline">
							Back to home
						</a>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}
