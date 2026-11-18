
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "FootballSim — Football Competition Simulator",
    short_name: "FootballSim",
    description:
      "Create and manage football competitions, generate fixtures, simulate matches, and track live standings with FootballSim.",

    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",

    background_color: "#080D13",
    theme_color: "#B7F56A",

    lang: "en",
    categories: ["sports", "entertainment", "utilities"],

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
