import { useId } from "react";

/**
 * CircularGauge - High-tech SVG radial gauge with gradient stroke,
 * tick marks, ambient glow, and centered metric display.
 */
function CircularGauge({
  value = 0,
  size = 140,
  strokeWidth = 10,
  label = "READY",
  sublabel = "",
  colorStart = "#fb923c",
  colorEnd = "#ea580c",
  showTicks = true,
  animate = true,
}) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `gauge-grad-${uid}`;

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const validValue = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (validValue / 100) * circumference;
  const center = size / 2;

  // Generate tick marks along the arc
  const ticks = [];
  if (showTicks) {
    const tickCount = 20;
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      const r1 = radius - strokeWidth / 2 - 4;
      const r2 = radius - strokeWidth / 2 - 7;
      const x1 = center + r1 * Math.cos(rad);
      const y1 = center + r1 * Math.sin(rad);
      const x2 = center + r2 * Math.cos(rad);
      const y2 = center + r2 * Math.sin(rad);
      const isActive = (i / tickCount) * 100 <= validValue;
      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isActive ? colorEnd : "#e2e8f0"}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={isActive ? 0.8 : 0.5}
        />
      );
    }
  }

  return (
    <div
      className="circular-gauge-wrapper"
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />

        {/* Ticks */}
        {ticks}

        {/* Active Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: animate ? "stroke-dashoffset 0.8s ease" : "none",
          }}
        />
      </svg>

      {/* Center Metrics Content */}
      <div
        className="gauge-center-content"
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: size > 120 ? "32px" : "24px",
            fontWeight: "800",
            color: "#0f172a",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {validValue}%
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: "700",
            color: "#64748b",
            letterSpacing: "0.08em",
            marginTop: "4px",
            textTransform: "uppercase",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            style={{
              fontSize: "9px",
              color: "#94a3b8",
              marginTop: "2px",
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

export default CircularGauge;
