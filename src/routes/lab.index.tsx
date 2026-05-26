import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/")({
  component: () => <Navigate to="/dashboard" search={{ tab: "lab" }} />,
});
