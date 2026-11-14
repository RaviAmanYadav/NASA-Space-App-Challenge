import { z } from "zod";

export const astronautProfileSchema = z.object({
  astronautId: z
    .string()
    .trim()
    .min(1, "Enter an astronaut ID.")
    .max(32, "Use 32 characters or fewer.")
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
      "Use letters, numbers, hyphens, or underscores.",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Enter the astronaut's name.")
    .max(100, "Use 100 characters or fewer."),
  age: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter age as a whole number.")
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(1, "Age must be at least 1.")
        .max(120, "Age must be 120 or less."),
    ),
  mission: z
    .string()
    .trim()
    .min(1, "Enter a mission.")
    .max(120, "Use 120 characters or fewer."),
});

export type AstronautProfileInput = z.input<typeof astronautProfileSchema>;
export type AstronautProfile = z.output<typeof astronautProfileSchema>;
