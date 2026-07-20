import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0A0D10",
          color: "#EEF1F2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 28,
              height: 28,
              border: "2px solid #EEF1F2",
              display: "flex",
            }}
          />
          <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1 }}>VIGIL</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: 60, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>
            The attention intelligence
            <br />
            layer for physical exam halls.
          </span>
          <span style={{ fontSize: 24, color: "#9AA3AC" }}>
            Sees behaviour. Explains evidence. Never accuses.
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
