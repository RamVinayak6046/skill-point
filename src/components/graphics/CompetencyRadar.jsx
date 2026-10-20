/**
 * CompetencyRadar - High-tech SVG polygon radar chart comparing
 * current capabilities vs required benchmarks across core competencies.
 */
function CompetencyRadar({
  data = [
    { label: "Skill Match", current: 75, target: 80 },
    { label: "Assessment", current: 65, target: 85 },
    { label: "Assignments", current: 80, target: 80 },
    { label: "Profile", current: 90, target: 90 },
  ],
  size = 220,
}) {
  const center = size / 2;
  const radius = size * 0.38;
  const count = data.length;

  // Compute points for a given dataset ratio
  const getCoordinates = (value, index) => {
    const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Concentric polygon grid levels (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Target polygon
  const targetPoints = data.map((d, i) => getCoordinates(d.target, i));
  const targetPath = targetPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // Current polygon
  const currentPoints = data.map((d, i) => getCoordinates(d.current, i));
  const currentPath = currentPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="radar-area-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Concentric grid webs */}
        {gridLevels.map((lvl, idx) => {
          const webPoints = data.map((_, i) => getCoordinates(lvl * 100, i));
          const webPath = webPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
          return (
            <path
              key={idx}
              d={webPath}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={idx === gridLevels.length - 1 ? "none" : "2,2"}
            />
          );
        })}

        {/* Axis lines radiating from center */}
        {data.map((_, i) => {
          const edge = getCoordinates(100, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={edge.x}
              y2={edge.y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {/* Benchmark target polygon (dashed) */}
        <path
          d={targetPath}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />

        {/* Current competency polygon */}
        <path
          d={currentPath}
          fill="url(#radar-area-grad)"
          stroke="#ea580c"
          strokeWidth="2"
        />

        {/* Data points */}
        {currentPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#ea580c" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="1.5" fill="#ea580c" />
          </g>
        ))}

        {/* Axis Labels */}
        {data.map((d, i) => {
          const labelDist = radius + 18;
          const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontWeight="700"
              fill="#475569"
              fontFamily="Inter, sans-serif"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default CompetencyRadar;
