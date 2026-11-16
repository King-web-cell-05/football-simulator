
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FootballSim",
    short_name: "FootballSim",
    description:
      "Manage football competitions, generate fixtures, simulate matches, and track standings.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#080d13",
    theme_color: "#a3f45b",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
