import { createFileRoute } from "@tanstack/react-router";
import { MissionDashboard } from "@/components/mission/mission-dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deep-Space Crew Health Telemetry | Flight Medicine Training" },
      {
        name: "description",
        content:
          "A simulated flight-medicine dashboard with crew telemetry, mission scenarios, reflex testing, and astronaut profile entry.",
      },
      {
        property: "og:title",
        content: "Deep-Space Crew Health Telemetry Training",
      },
      {
        property: "og:description",
        content:
          "Explore a simulated flight-medicine training console for astronaut physiology and mission scenarios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionDashboard,
});
