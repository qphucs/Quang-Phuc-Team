import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/copy";

/** Web app manifest: lets members add the team app to their phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: "QP Team",
    description: "Cổng nội bộ của team edit CapCut Quang Phúc",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    lang: "vi",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
