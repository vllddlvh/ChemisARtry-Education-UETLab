import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
    lesson: z.string().optional(),
    spawn: z.string().optional(),
    element: z.string().optional(),
});

export const Route = createFileRoute("/lab/sim")({
    validateSearch: searchSchema,
    beforeLoad: () => {
        throw redirect({ to: "/lab/ar" });
    },
    component: () => null,
});
