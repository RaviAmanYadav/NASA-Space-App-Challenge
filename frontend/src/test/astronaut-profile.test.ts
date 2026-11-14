import { describe, expect, it } from "vitest";

import { astronautProfileSchema } from "@/lib/astronaut-profile";

describe("astronaut profile entry validation", () => {
  it("accepts an ID, name, whole-number age, and mission", () => {
    const result = astronautProfileSchema.safeParse({
      astronautId: "AST-05-LEE",
      name: "Jordan Lee",
      age: "38",
      mission: "Artemis IV",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(38);
  });

  it("rejects missing details and non-whole-number ages", () => {
    expect(
      astronautProfileSchema.safeParse({
        astronautId: "",
        name: "",
        age: "",
        mission: "",
      }).success,
    ).toBe(false);
    expect(
      astronautProfileSchema.safeParse({
        astronautId: "AST-05-LEE",
        name: "Jordan Lee",
        age: "38.5",
        mission: "Artemis IV",
      }).success,
    ).toBe(false);
  });
});
