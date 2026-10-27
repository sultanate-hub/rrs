import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RRS Anti-Social Vices Management System",
    short_name: "RRS ASV",
    description: "Secure case, suspect, evidence and court records for the Rapid Response Squad.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f6fb",
    theme_color: "#0b2545",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
