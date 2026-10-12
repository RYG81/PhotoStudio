import { createFileRoute } from "@tanstack/react-router";
import { StudioShell } from "@/studio/shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <StudioShell />;
}
