import { useState, useEffect, useCallback, ReactNode } from "react";

const IS_DEV = import.meta.env.DEV;

interface DeviceSpec {
  name: string;
  brand: "apple" | "samsung" | "google" | "oneplus" | "xiaomi";
  width: number;
  height: number;
  borderRadius: number;
  hasIsland: boolean;
  hasPunchHole: boolean;
}

const DEVICES: DeviceSpec[] = [
  { name: "iPhone 16 Pro Max", brand: "apple", width: 430, height: 932, borderRadius: 54, hasIsland: true, hasPunchHole: false },
  { name: "iPhone 16", brand: "apple", width: 390, height: 844, borderRadius: 50, hasIsland: true, hasPunchHole: false },
  { name: "Samsung Galaxy S25 Ultra", brand: "samsung", width: 412, height: 892, borderRadius: 38, hasIsland: false, hasPunchHole: true },
  { name: "Samsung Galaxy S25", brand: "samsung", width: 360, height: 780, borderRadius: 36, hasIsland: false, hasPunchHole: true },
  { name: "Google Pixel 9 Pro", brand: "google", width: 412, height: 892, borderRadius: 44, hasIsland: false, hasPunchHole: true },
  { name: "Google Pixel 9", brand: "google", width: 393, height: 852, borderRadius: 42, hasIsland: false, hasPunchHole: true },
  { name: "OnePlus 13", brand: "oneplus", width: 412, height: 917, borderRadius: 42, hasIsland: false, hasPunchHole: true },
  { name: "Xiaomi 15 Pro", brand: "xiaomi", width: 440, height: 978, borderRadius: 46, hasIsland: false, hasPunchHole: true },
];

const BEZEL_X = 14;
const BEZEL_TOP = 14;
const BEZEL_BOTTOM = 24;
const TOOLBAR_HEIGHT = 60;
const PAGE_PADDING = 28;

const BRAND_LABEL: Record<DeviceSpec["brand"], string> = {
  apple: "Apple",
  samsung: "Samsung",
  google: "Google",
  oneplus: "OnePlus",
  xiaomi: "Xiaomi",
};

function SideButton({ style }: { style: React.CSSProperties }) {
  return <div style={style} />;
}

function PhoneFrame({ device, children }: { device: DeviceSpec; children: ReactNode }) {
  const isApple = device.brand === "apple";
  const chassisW = device.width + BEZEL_X * 2;
  const chassisH = device.height + BEZEL_TOP + BEZEL_BOTTOM;
  const screenRadius = device.borderRadius - BEZEL_X;

  const buttonBase: React.CSSProperties = {
    position: "absolute",
    borderRadius: 2,
  };

  const leftBtn: React.CSSProperties = {
    ...buttonBase,
    left: -4,
    width: 4,
    background: "linear-gradient(to right, #161616, #2a2a2a)",
    boxShadow: "-1px 0 4px rgba(0,0,0,0.7)",
    borderRadius: "2px 0 0 2px",
  };

  const rightBtn: React.CSSProperties = {
    ...buttonBase,
    right: -4,
    width: 4,
    background: "linear-gradient(to left, #161616, #2a2a2a)",
    boxShadow: "1px 0 4px rgba(0,0,0,0.7)",
    borderRadius: "0 2px 2px 0",
  };

  return (
    <div
      style={{
        position: "relative",
        width: chassisW,
        height: chassisH,
        background: isApple
          ? "linear-gradient(160deg, #303030 0%, #1a1a1a 45%, #2b2b2b 100%)"
          : "linear-gradient(160deg, #222222 0%, #111111 50%, #1e1e1e 100%)",
        borderRadius: device.borderRadius,
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.07)",
          "0 0 0 2.5px rgba(0,0,0,0.7)",
          "inset 4px 0 10px -4px rgba(255,255,255,0.05)",
          "inset -4px 0 10px -4px rgba(0,0,0,0.5)",
          "inset 0 4px 10px -4px rgba(255,255,255,0.04)",
          "inset 0 -4px 10px -4px rgba(0,0,0,0.4)",
          "0 40px 100px rgba(0,0,0,0.85)",
          "0 20px 50px rgba(0,0,0,0.6)",
        ].join(", "),
        flexShrink: 0,
      }}
    >
      {/* Left side buttons */}
      {isApple ? (
        <>
          <SideButton style={{ ...leftBtn, top: 96, height: 30 }} />
          <SideButton style={{ ...leftBtn, top: 148, height: 62 }} />
          <SideButton style={{ ...leftBtn, top: 224, height: 62 }} />
        </>
      ) : (
        <>
          <SideButton style={{ ...leftBtn, top: 118, height: 54 }} />
          <SideButton style={{ ...leftBtn, top: 188, height: 54 }} />
        </>
      )}

      {/* Right side power button */}
      <SideButton style={{ ...rightBtn, top: isApple ? 158 : 148, height: isApple ? 88 : 70 }} />

      {/* Screen container */}
      <div
        style={{
          position: "absolute",
          top: BEZEL_TOP,
          left: BEZEL_X,
          width: device.width,
          height: device.height,
          background: "#000",
          borderRadius: screenRadius,
          overflow: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Scrollable app content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>

        {/* Cutout overlay — non-interactive, sits above content */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            pointerEvents: "none",
            zIndex: 50,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            paddingTop: device.hasIsland ? 14 : 10,
          }}
        >
          {device.hasIsland && (
            <div
              style={{
                width: 126,
                height: 37,
                background: "#000",
                borderRadius: 20,
              }}
            />
          )}
          {device.hasPunchHole && (
            <div
              style={{
                width: 12,
                height: 12,
                background: "#000",
                borderRadius: "50%",
                marginTop: 4,
                boxShadow: "0 0 0 1.5px rgba(255,255,255,0.06)",
              }}
            />
          )}
        </div>

        {/* Home indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 134,
            height: 5,
            background: "rgba(255,255,255,0.28)",
            borderRadius: 3,
            pointerEvents: "none",
            zIndex: 50,
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  children: ReactNode;
}

export default function DevMobileWrapper({ children }: Props) {
  if (!IS_DEV) return <>{children}</>;

  const [deviceIndex, setDeviceIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const device = DEVICES[deviceIndex];

  const chassisW = device.width + BEZEL_X * 2;
  const chassisH = device.height + BEZEL_TOP + BEZEL_BOTTOM;

  const computeScale = useCallback(() => {
    const availW = window.innerWidth - PAGE_PADDING * 2;
    const availH = window.innerHeight - TOOLBAR_HEIGHT - PAGE_PADDING * 2;
    const s = Math.min(availW / chassisW, availH / chassisH, 1);
    setScale(Math.max(s, 0.3));
  }, [chassisW, chassisH]);

  useEffect(() => {
    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [computeScale]);

  const groupedByBrand = DEVICES.reduce<Record<string, DeviceSpec[]>>((acc, d) => {
    const label = BRAND_LABEL[d.brand];
    if (!acc[label]) acc[label] = [];
    acc[label].push(d);
    return acc;
  }, {});

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(ellipse at center, #232323 0%, #141414 100%)",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          height: TOOLBAR_HEIGHT,
          background: "#0e0e0e",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          paddingInline: 16,
          gap: 6,
          overflowX: "auto",
          flexShrink: 0,
          scrollbarWidth: "none",
        }}
      >
        <span
          style={{
            color: "#f59e0b",
            fontSize: 10,
            fontFamily: "monospace",
            fontWeight: 700,
            letterSpacing: "0.12em",
            whiteSpace: "nowrap",
            marginRight: 8,
            padding: "3px 8px",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 4,
            background: "rgba(245,158,11,0.08)",
          }}
        >
          DEV
        </span>

        {Object.entries(groupedByBrand).map(([brand, devices]) => (
          <div key={brand} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 10,
                fontFamily: "system-ui, sans-serif",
                whiteSpace: "nowrap",
                paddingLeft: 6,
              }}
            >
              {brand}
            </span>
            {devices.map((d) => {
              const idx = DEVICES.indexOf(d);
              const isActive = idx === deviceIndex;
              return (
                <button
                  key={d.name}
                  onClick={() => setDeviceIndex(idx)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 16,
                    border: "1px solid",
                    borderColor: isActive ? "#f59e0b" : "rgba(255,255,255,0.1)",
                    background: isActive ? "rgba(245,158,11,0.14)" : "rgba(255,255,255,0.03)",
                    color: isActive ? "#f59e0b" : "rgba(255,255,255,0.45)",
                    fontSize: 11,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "system-ui, sans-serif",
                    transition: "all 0.15s ease",
                    outline: "none",
                  }}
                >
                  {d.name.replace(brand + " ", "").replace("iPhone ", "iPhone ").replace("Google ", "").replace("Xiaomi ", "")}
                </button>
              );
            })}
          </div>
        ))}

        <span
          style={{
            marginLeft: "auto",
            color: "rgba(255,255,255,0.2)",
            fontSize: 10,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            flexShrink: 0,
            paddingLeft: 12,
          }}
        >
          {device.width} × {device.height}
        </span>
      </div>

      {/* Phone display area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: PAGE_PADDING,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <PhoneFrame device={device}>{children}</PhoneFrame>
        </div>
      </div>
    </div>
  );
}
