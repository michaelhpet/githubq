import Button from "@/components/button";
import { GITHUB_USERNAME_REGEX } from "@/lib/constants";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username) return setError("Please enter a GitHub username or URL");
    const match = username.match(GITHUB_USERNAME_REGEX);
    if (!match || !match.groups)
      return setError("Please enter a valid username or URL");
    navigate(`/${match.groups.username}`);
  };

  return (
    <div className="w-full min-h-[calc(100vh-128px)] flex flex-col gap-12 py-28">
      <article className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-7xl font-bold font-heading">
          Audit GitHub Profiles Quickly!
        </h1>
        <p className="max-w-2xl text-2xl">
          Create and export a comprehensive report of a developer&apos;s GitHub
          activities, frequency of work, languages used, other important stuff.
        </p>
      </article>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 pr-4 border-[3px] border-stroke rounded-2xl bg-transparent outline-none has-[input:focus]:outline-[3px] has-[input:focus]:outline-accent has-[input:focus]:outline-offset-[3px]">
          <input
            placeholder="GitHub username or URL"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            className="w-full p-5 border-none outline-none bg-transparent text-3xl font-medium placeholder:text-dim"
          />
          <Button className="shrink-0 min-w-44 min-h-full text-2xl font-bold focus:outline-[3px] focus:outline-offset-[3px]">
            Audit profile
          </Button>
        </div>
        {Boolean(error) && (
          <p className="text-sm text-red-500 font-medium">🚫&nbsp;{error}</p>
        )}
      </form>
    </div>
  );
}
