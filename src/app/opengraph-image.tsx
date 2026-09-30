import { ImageResponse } from "next/og";
import { restaurang } from "@/data/restaurang";

/** Bilden som visas när någon delar länken i Messenger, WhatsApp, sms eller på Facebook. */
export const alt = `${restaurang.namn} – ${restaurang.tagline} i ${restaurang.ort}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphBild() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "#0b0614",
          color: "#f5eefb",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: -2,
            color: "#ff2e88",
            textTransform: "uppercase",
          }}
        >
          {restaurang.namn}
        </div>
        <div style={{ display: "flex", fontSize: 62, marginTop: 10 }}>
          {restaurang.tagline} i {restaurang.ort}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 38,
            marginTop: 44,
            color: "#b9aacb",
          }}
        >
          Pizza · Smash burgare · Kebab · Beställ online
        </div>
      </div>
    ),
    { ...size },
  );
}
