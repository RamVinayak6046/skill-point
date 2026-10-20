import { useId } from "react";

/**
 * Sparkline - Lightweight SVG micro-chart displaying smooth trend curves
 * with gradient area fill and glowing endpoint dot.
 */
function Sparkline({
  data = [20, 25, 35, 30, 45, 55, 65, 75],
  width = 90,
  height = 36,
  color = "#ea580c",
  fillOpacity = 0.15,
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `spark-grad-${uid}`;

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const paddingX = 4;
  const paddingY = 4;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Map data to coordinates
  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * chartW;
    const y = height - paddingY - ((val - min) / range) * chartH;
    return { x, y };
  });

  // Construct smooth bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  // Area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Line path */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Glowing Endpoint Dot */}
      <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="#ffffff" stroke={color} strokeWidth="2" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="2" fill={color} />
    </svg>
  );
}

export default Sparkline;
