import { Tag } from "@/components/tag";
import { Activity } from "./activity";
import { Developer } from "./developer";
import { Languages } from "./languages";
import { Repositories } from "./repositories";
import { WebApps } from "./web-apps";

export function Profile() {
	const SECTIONS = [
		{ label: "Developer", component: <Developer /> },
		{ label: "Web apps", component: <WebApps /> },
		{ label: "Top repositories", component: <Repositories /> },
		{ label: "Languages", component: <Languages /> },
		{ label: "Activity", component: <Activity /> },
	];

	return (
		<div className="flex flex-col">
			{SECTIONS.map((section) => (
				<section key={section.label} className="flex flex-col gap-4 p-4">
					<Tag>{section.label}</Tag>
					{section.component}
				</section>
			))}
		</div>
	);
}
