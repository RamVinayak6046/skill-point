/**
 * DualProgressBar - Reengineered Competency Benchmark & Progress Visualizer
 * Features:
 * - Current proficiency progress fill with achievement gradients
 * - Explicit visual Deficit Gap Zone connecting Current to Target Benchmark
 * - Precision Milestone Pin for the target benchmark threshold
 */
function DualProgressBar({
  current = 0,
  target = 80,
  height = 9,
  showLabels = false,
}) {
  const validCurrent = Math.min(Math.max(current, 0), 100);
  const validTarget = Math.min(Math.max(target, 0), 100);

  const isTargetMet = validCurrent >= validTarget;
  const hasGap = validCurrent < validTarget;
  const gapWidth = hasGap ? validTarget - validCurrent : 0;

  // Primary milestone state
  const markerColor = isTargetMet ? "#059669" : "#0f172a";

  return (
    <div style={{ position: "relative", width: "100%", padding: "4px 0" }}>
      {showLabels && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            fontWeight: "600",
            marginBottom: "5px",
            color: "#64748b",
          }}
        >
          <span>
            Current:{" "}
            <strong style={{ color: isTargetMet ? "#15803d" : "#ea580c", fontWeight: "700" }}>
              {validCurrent}%
            </strong>
          </span>
          <span>
            Target:{" "}
            <strong style={{ color: "#0f172a", fontWeight: "700" }}>
              {validTarget}%
            </strong>
          </span>
        </div>
      )}

      {/* Main Track Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: `${height}px`,
          backgroundColor: "var(--bg-surface, #f1f5f9)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "999px",
          overflow: "visible",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Track interior with overflow hidden for the fills */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "999px",
            overflow: "hidden",
            display: "flex",
          }}
        >
          {/* Current Proficiency Fill */}
          {validCurrent > 0 && (
            <div
              style={{
                width: `${validCurrent}%`,
                height: "100%",
                background: isTargetMet
                  ? "linear-gradient(90deg, #16a34a 0%, #15803d 100%)"
                  : "linear-gradient(90deg, #f97316 0%, #ea580c 100%)",
                borderRadius: validCurrent === 100 ? "999px" : "999px 0 0 999px",
                transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          )}

          {/* Visual Deficit Gap Zone (distance to target benchmark) */}
          {hasGap && gapWidth > 0 && (
            <div
              title={`Deficit to Benchmark: -${gapWidth}%`}
              style={{
                width: `${gapWidth}%`,
                height: "100%",
                background:
                  "repeating-linear-gradient(45deg, rgba(234, 88, 12, 0.08), rgba(234, 88, 12, 0.08) 4px, rgba(234, 88, 12, 0.18) 4px, rgba(234, 88, 12, 0.18) 8px)",
                borderRight: "1.5px dashed #ea580c",
                transition: "width 0.4s ease",
              }}
            />
          )}
        </div>

        {/* Reengineered Precision Benchmark Target Milestone Pin */}
        <div
          title={`Target Benchmark: ${validTarget}% (${
            isTargetMet
              ? "✓ Benchmark Met"
              : `Deficit: -${validTarget - validCurrent}% remaining`
          })`}
          style={{
            position: "absolute",
            left: `${validTarget}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "5px",
            height: `${height + 7}px`,
            backgroundColor: markerColor,
            borderRadius: "3px",
            border: "1.5px solid #ffffff",
            boxShadow: isTargetMet
              ? "0 1px 4px rgba(16, 185, 129, 0.35)"
              : "0 1px 4px rgba(15, 23, 42, 0.28)",
            zIndex: 3,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        />
      </div>
    </div>
  );
}

export default DualProgressBar;
