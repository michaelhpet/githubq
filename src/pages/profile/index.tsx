import { Tag } from "@/components/tag";
import { useSession } from "@/lib/auth/session";
import { Activity } from "./activity";
import { Developer } from "./developer";
import { Leadership } from "./leadership";
import { Repositories } from "./repositories";

function AuthNotice() {
	const { token, login } = useSession();
	if (token) return null;
	return (
		<div
			role="alert"
			className="flex flex-col gap-2 rounded-lg border border-stroke bg-background p-3 sm:flex-row sm:items-center sm:justify-between print:hidden"
		>
			<p className="text-sm font-medium">
				Please login with GitHub for more queries and exhaustive metrics
			</p>
			<button
				type="button"
				onClick={() => void login()}
				className="shrink-0 text-sm font-medium underline hover:no-underline"
			>
				Login with GitHub
			</button>
		</div>
	);
}

export function Profile() {
	const SECTIONS = [
		{ id: "profile", component: <Developer /> },
		{ id: "work", label: "Work", component: <Activity /> },
		{ id: "leadership", label: "Leadership", component: <Leadership /> },
		{ id: "repos", label: "Top repositories", component: <Repositories /> },
	];

	return (
		<div className="flex flex-col" data-export-root>
			<div className="px-4 pt-4">
				<AuthNotice />
			</div>
			{SECTIONS.map((section) => (
				<section key={section.id} className="flex flex-col gap-4 p-4">
					{!!section.label && <Tag>{section.label}</Tag>}
					{section.component}
				</section>
			))}
		</div>
	);
}
