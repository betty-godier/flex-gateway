"use client";

type Interval = {
  time: string;
  trucksConnected: number;
  maxPossiblePowerKW: number;
};

type Props = {
  intervals: Interval[];
};

export function SitePowerChart({ intervals }: Props) {
  if (!intervals || intervals.length === 0) {
    return <p>No data to display.</p>;
  }

  // Limit the number of points to avoid a huge SVG
  const maxPoints = 96; // 24h * 4 (15-min)
  const data = intervals.slice(0, maxPoints);

  const maxPower =
    data.reduce(
      (max, i) => (i.maxPossiblePowerKW > max ? i.maxPossiblePowerKW : max),
      0
    ) || 1;

  const width = 800;
  const height = 260;
  const padding = 40;

  const innerWidth = width - 2 * padding;
  const innerHeight = height - 2 * padding;

  const points = data
    .map((i, idx) => {
      const x =
        padding +
        (data.length === 1
          ? innerWidth / 2
          : (idx / (data.length - 1)) * innerWidth);

      const y =
        padding +
        (1 - i.maxPossiblePowerKW / maxPower) * innerHeight; // invert Y

      return `${x},${y}`;
    })
    .join(" ");

  const yTicks = 4;
  const yStep = maxPower / yTicks;

  return (
    <div style={{ marginTop: 16 }}>
      <svg
        width={width}
        height={height}
        style={{
          border: "1px solid #ddd",
          background: "#fafafa",
          borderRadius: 4,
        }}
      >
        {/* Y axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#999"
        />
        {/* X axis */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#999"
        />

        {/* Y axis ticks & labels */}
        {Array.from({ length: yTicks + 1 }).map((_, idx) => {
          const value = idx * yStep;
          const y =
            padding + (1 - value / maxPower) * innerHeight;

          return (
            <g key={idx}>
              <line
                x1={padding - 5}
                y1={y}
                x2={padding}
                y2={y}
                stroke="#999"
              />
              <text
                x={padding - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#333"
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* Chart title */}
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
        >
          Aggregated site power (kW)
        </text>

        {/* Y axis label */}
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fontSize="10"
          transform={`rotate(-90 15 ${height / 2})`}
        >
          kW
        </text>

        {/* X axis label */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="10"
        >
          Time (15-min intervals, first {data.length})
        </text>

        {/* Line */}
        <polyline
          fill="none"
          stroke="#1f77b4"
          strokeWidth={2}
          points={points}
        />

        {/* Points */}
        {data.map((i, idx) => {
          const x =
            padding +
            (data.length === 1
              ? innerWidth / 2
              : (idx / (data.length - 1)) * innerWidth);
          const y =
            padding +
            (1 - i.maxPossiblePowerKW / maxPower) * innerHeight;

          return (
            <circle key={i.time} cx={x} cy={y} r={2} fill="#1f77b4" />
          );
        })}
      </svg>
      <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
        Showing max possible site power per 15-minute interval, capped by site
        limit.
      </p>
    </div>
  );
}
