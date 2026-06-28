import type { MetadataRoute } from "next";

// PWA manifest — telefona "uygulama gibi" eklenebilmesi için.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YK Coaching",
    short_name: "YK Coaching",
    description: "Kişisel antrenörlük programları ve takip platformu",
    start_url: "/panel",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
