import { lato } from "@/lib/constants/fonts";
import "./globals.css";
import type { Metadata } from "next";

interface Props {
  children: React.ReactNode;
}

export default function RootLayout(props: Props) {
  return (
    <html lang="en">
      <body className={lato.className}>{props.children}</body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "GitHubQ - Audit GitHub profiles",
  description:
    "Lets recruiters and developers create a comprehensive report of activities, frequency of work, languages used, and export as a PDF or a shareable webpage.",
};
