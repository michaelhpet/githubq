import { Tag } from "@/components/tag";
import { Activity } from "./activity";
import { Developer } from "./developer";
import { Languages } from "./languages";
import { Repositories } from "./repositories";

export function Profile() {
	const SECTIONS = [
		{ id: "profile", component: <Developer /> },
		{ id: "work", label: "Work", component: <Activity /> },
		{ id: "repos", label: "Top repositories", component: <Repositories /> },
		{ id: "languages", label: "Languages", component: <Languages /> },
	];

	return (
		<div className="flex flex-col">
			{SECTIONS.map((section) => (
				<section key={section.id} className="flex flex-col gap-4 p-4">
					{!!section.label && <Tag>{section.label}</Tag>}
					{section.component}
				</section>
			))}
		</div>
	);
}
