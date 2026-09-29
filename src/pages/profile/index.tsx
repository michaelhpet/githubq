import { useParams } from "react-router-dom";
import appIcon from "@/assets/icons/githubq-icon.svg";
import linkIcon from "@/assets/icons/link-icon.svg";
import dp from "@/assets/images/profile-photo.png";
import Button from "@/components/button";
import Tag from "@/components/tag";
import { useProfile } from "@/lib/api/get-profile";

export default function Profile() {
  const SECTIONS = [
    { label: "Developer", component: <DeveloperSection /> },
    { label: "Web apps", component: <Webapps /> },
    { label: "Top repositories", component: <DeveloperSection /> },
    { label: "Languages", component: <DeveloperSection /> },
    { label: "Activity", component: <DeveloperSection /> },
  ];

  return (
    <div className="flex flex-col">
      {SECTIONS.map((section) => (
        <section key={section.label} className="flex flex-col gap-4 p-4">
          <Tag label={section.label} />
          {section.component}
        </section>
      ))}
    </div>
  );
}

function DeveloperSection() {
  const { username } = useParams();
  const { data } = useProfile(username);

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <img
          src={data?.avatar_url ?? dp}
          alt={data?.login ?? "Profile photo"}
          className="w-20 h-20 rounded-lg"
        />
        <article className="flex flex-col">
          <p className="font-bold">
            {data?.name ?? data?.login ?? "Michael Peter"}
          </p>
          <p className="max-w-64 text-sm text-dim">
            {data?.bio ??
              "I'm committed to building appealing apps and helping people learn how to code."}
          </p>
          <div className="flex items-center"></div>
        </article>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outlined">Audit again</Button>
        <Button>Download</Button>
      </div>
    </div>
  );
}

function Webapps() {
  const APPS = [
    {
      name: "QuickNLP",
      url: "https://quicknlp.michaelhpet.com",
      description:
        "I'm committed to building appealing apps and helping people learn how to code. I'm committed to building. Lorem ipsum dolor sit amet.",
    },
    {
      name: "githubq",
      url: "https://githubq.michaelhpet.com",
      description:
        "I'm committed to building appealing apps and helping people learn how to code. I'm committed to building. Lorem ipsum dolor sit amet.",
    },
    {
      name: "QuickNLP-1",
      url: "https://quicknlp.michaelhpet.com",
      description:
        "I'm committed to building appealing apps and helping people learn how to code. I'm committed to building. Lorem ipsum dolor sit amet.",
    },
    {
      name: "QuickNLP-2",
      url: "https://quicknlp.michaelhpet.com",
      description:
        "I'm committed to building appealing apps and helping people learn how to code. I'm committed to building. Lorem ipsum dolor sit amet.",
    },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
      {APPS.map((app) => (
        <div
          key={app.name}
          className="flex flex-col gap-2 p-2 rounded-lg border-2 border-stroke bg-background shadow"
        >
          <div className="flex items-center gap-2">
            <img src={appIcon} alt={`${app.name} icon`} className="w-8 h-8" />
            <article>
              <p className="text-sm">{app.name}</p>
              <p className="text-xs text-dim">{app.url}</p>
            </article>
          </div>
          <div className="flex items-start gap-2 p-2 bg-dark rounded">
            <p className="text-sm text-dim line-clamp-4">{app.description}</p>
            <div className="shrink-0 w-24 h-full flex items-center justify-center rounded-sm bg-[#C4C4C4]">
              <img src={linkIcon} alt="Link icon" className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
