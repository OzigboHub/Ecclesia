import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ecclesia DPM - Digital Parish Manager",
    short_name: "Ecclesia",
    description: "Comprehensive Catholic parish management system",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#1f2937",
    theme_color: "#eab308",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
