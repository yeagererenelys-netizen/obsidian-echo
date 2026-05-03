import { createFileRoute, redirect } from "@tanstack/react-router";
import { Shell } from "@/components/ps/Shell";

export const Route = createFileRoute("/app")({
  component: Shell,
});
