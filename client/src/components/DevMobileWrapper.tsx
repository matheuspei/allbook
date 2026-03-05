import { useState, useEffect, useCallback, ReactNode } from "react";

const IS_DEV = import.meta.env.DEV;

interface Device {
  name: string;
  width: number;
  height: number;
}

const DEVICES: Device[] = [
  { name: "iPhone 16 Pro Max", width: 430, height: 932 },
  { name: "iPhone 16", width: 390, height: 844 },
  { name: "Samsung Galaxy S25 Ultra", width: 412, height: 892 },
  { name: "Samsung Galaxy S25", width: 360, height: 780 },
  { name: "Google Pixel 9 Pro", width: 412, height: 892 },
  { name: "Google Pixel 9", width: 393, height: 852 },
  { name: "OnePlus 13", width: 412, height: 917 },
  { name: "Xiaomi 15 Pro", width: 440, height: 978 },
];

const TOOLBAR_H = 48;
const PAD = 24;
const FRAME_BORDER = 2;
const FRAME_RADIUS = 24;

export default function DevMobileWrapper({ children }: { children: ReactNode }) {
  if (!IS_DEV) return <>{children}</>;

  const [idx, setIdx] = useState(0);
  const [scale, setScale] = useState(1);
  const device = DEVICES[idx];

  const outerW = device.width + FRAME_BORDER * 2;
  const outerH = device.height + FRAME_BORDER * 2;

  const recompute = useCallback(() => {
    const aw = window.innerWidth - PAD * 2;
    const ah = window.innerHeight - TOOLBAR_H - PAD * 2;
    setScale(Math.min(aw / outerW, ah / outerH, 1));
  }, [outerW, outerH]);

  useEffect(() => {
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [recompute]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        background: "#1a1a1a",
        overflow: "hidden",
      }}
    >
      {/* toolbar */}
      <div
        style={{
          height: TOOLBAR_H,
          background: "#111",
          borderBottom: "1px solid #2a2a2a",
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingInline: 12,
          overflowX: "auto",
          flexShrink: 0,
          scrollbarWidth: "none",
        }}
      >
        {DEVICES.map((d, i) => (
          <button
            key={d.name}
            onClick={() => setIdx(i)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "none",
              background: i === idx ? "#333" : "transparent",
              color: i === idx ? "#fff" : "#777",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {d.name}
          </button>
        ))}
        <span
          style={{
            marginLeft: "auto",
            color: "#555",
            fontSize: 11,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            flexShrink: 0,
            paddingLeft: 8,
          }}
        >
          {device.width}x{device.height}
        </span>
      </div>

      {/* phone area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: PAD,
          overflow: "hidden",
        }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
          <div
            style={{
              width: outerW,
              height: outerH,
              border: `${FRAME_BORDER}px solid #333`,
              borderRadius: FRAME_RADIUS,
              overflow: "hidden",
              background: "#000",
            }}
          >
            <div
              style={{
                width: device.width,
                height: device.height,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
