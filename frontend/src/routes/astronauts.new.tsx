import { createFileRoute } from "@tanstack/react-router";

import { AstronautEntryPage } from "@/components/mission/astronaut-entry-page";

export const Route = createFileRoute("/astronauts/new")({
  head: () => ({
    meta: [
      { title: "New Astronaut Profile | Flight Medicine Training" },
      {
        name: "description",
        content:
          "Enter a fictional astronaut ID, name, age, and mission for a flight-medicine training profile.",
      },
      {
        property: "og:title",
        content: "New Astronaut Profile | Flight Medicine Training",
      },
      {
        property: "og:description",
        content:
          "Enter astronaut details for a simulated mission training profile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AstronautEntryPage,
});
