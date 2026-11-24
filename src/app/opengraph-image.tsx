/* eslint-disable @next/next/no-img-element */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — luxury coastal stays in Lagos, Nigeria`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const heroImage = await readFile(join(process.cwd(), "public/images/home/hero.webp"));
  const heroImageSrc = `data:image/webp;base64,${heroImage.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#17383a",
        color: "#fbf7ef",
        fontFamily: "Georgia, serif",
      }}
    >
      <img
        src={heroImageSrc}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(90deg, rgba(10, 34, 36, 0.88) 0%, rgba(10, 34, 36, 0.48) 56%, rgba(10, 34, 36, 0.04) 100%)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "relative",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "64px 76px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span style={{ fontSize: 24, letterSpacing: 7, textTransform: "uppercase" }}>Markson</span>
          <span style={{ fontFamily: "Arial, sans-serif", fontSize: 12, letterSpacing: 5, opacity: 0.82 }}>
            HOTELS &amp; RESORTS
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 700 }}>
          <span
            style={{
              color: "#e1c99a",
              fontFamily: "Arial, sans-serif",
              fontSize: 15,
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            Coastal luxury · Lagos, Nigeria
          </span>
          <span style={{ fontSize: 66, lineHeight: 1.08 }}>Your Home by the Ocean</span>
          <span style={{ fontFamily: "Arial, sans-serif", fontSize: 20, opacity: 0.9 }}>
            Sun-kissed shores. Unforgettable stays.
          </span>
        </div>
      </div>
    </div>,
    size,
  );
}
