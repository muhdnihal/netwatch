import { useState } from "react";

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const METRIC_DATA = {
  latency: [12, 18, 14, 22, 19, 31, 45, 28, 16, 13, 20, 24],
  packets: [88, 94, 72, 85, 110, 130, 99, 87, 102, 115, 93, 88],
  errors: [0, 1, 0, 2, 0, 0, 3, 1, 0, 0, 2, 1],
  bandwidth: [1.2, 1.8, 2.3, 1.9, 3.1, 2.8, 2.4, 1.6, 1.3, 2.0, 2.7, 3.2],
};

function LineChart({ data, color, unit, label }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 100, H = 60;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return `${x},${y}`;
  });

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>{label}</div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "80px", overflow: "visible" }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <polygon
          points={`0,${H} ${pts.join(" ")} ${W},${H}`}
          fill={`url(#grad-${color})`}
        />
        {data.map((v, i) => {
          const [x, y] = pts[i].split(",");
          return <circle key={i} cx={x} cy={y} r="2" fill={color} vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>00:00</span>
        <span style={{ fontSize: "10px", color, fontWeight: "700" }}>
          {data[data.length - 1]}{unit}
        </span>
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>23:00</span>
      </div>
    </div>
  );
}

const TOP_ENDPOINTS = [
  { path: "/api/v2/users", calls: "84,210", latency: "12ms", color: "var(--accent-cyan)" },
  { path: "/api/v2/events", calls: "61,330", latency: "18ms", color: "var(--accent-green)" },
  { path: "/health", calls: "48,900", latency: "3ms", color: "var(--accent-purple)" },
  { path: "/api/v1/auth", calls: "33,440", latency: "44ms", color: "var(--accent-orange)" },
  { path: "/api/v2/metrics", calls: "22,100", latency: "29ms", color: "var(--accent-yellow)" },
];

const INSTANCE_DATA = [
  { id: "i-0a1b2c3d", type: "t3.medium", az: "us-east-1a", cpu: 68, net: "1.2 GB/s" },
  { id: "i-0e4f5g6h", type: "t3.medium", az: "us-east-1b", cpu: 42, net: "0.8 GB/s" },
  { id: "i-0i7j8k9l", type: "t3.large", az: "us-east-1c", cpu: 81, net: "2.1 GB/s" },
  { id: "i-0m1n2o3p", type: "t3.large", az: "us-east-1a", cpu: 23, net: "0.4 GB/s" },
];

export default function Analytics() {
  const [activeMetric, setActiveMetric] = useState("bandwidth");

  const metrics = [
    { key: "bandwidth", label: "Bandwidth GB/s", color: "#00d4ff", unit: " GB/s" },
    { key: "latency", label: "Avg Latency ms", color: "#00ff9d", unit: "ms" },
    { key: "packets", label: "Packets K/s", color: "#bd00ff", unit: "K" },
    { key: "errors", label: "Error Rate", color: "#ff3366", unit: "%" },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Analytics</div>
        <div className="page-title">Traffic <span>Analytics</span></div>
        <div className="page-subtitle">CloudWatch · X-Ray · Kinesis · Athena · QuickSight</div>
      </div>

      {/* Metric selector */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {metrics.map(m => (
          <button
            key={m.key}
            className={`btn ${activeMetric === m.key ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "6px 14px", fontSize: "11px" }}
            onClick={() => setActiveMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Main metric chart */}
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">
            {metrics.find(m => m.key === activeMetric)?.label} — 24h View
          </div>
          <div className="card-badge live">CloudWatch Metrics</div>
        </div>
        {metrics.filter(m => m.key === activeMetric).map(m => (
          <LineChart
            key={m.key}
            data={METRIC_DATA[m.key]}
            color={m.color}
            unit={m.unit}
            label={`Hourly ${m.label}`}
          />
        ))}
      </div>

      {/* Mini metric cards */}
      <div className="grid-4 section-gap">
        {metrics.map(m => (
          <div className="card" key={m.key} style={{ cursor: "pointer" }} onClick={() => setActiveMetric(m.key)}>
            <div className="card-title" style={{ marginBottom: "12px" }}>{m.label}</div>
            <LineChart
              data={METRIC_DATA[m.key]}
              color={m.color}
              unit={m.unit}
              label=""
            />
          </div>
        ))}
      </div>

      <div className="grid-2 section-gap">
        {/* Top Endpoints */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top API Endpoints</div>
            <div className="card-badge live">X-Ray Traces</div>
          </div>
          <div>
            {TOP_ENDPOINTS.map((e, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "10px", alignItems: "center", padding: "8px 0", borderBottom: i < TOP_ENDPOINTS.length - 1 ? "1px solid var(--border-dim)" : "none" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: e.color }}>{e.path}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{e.calls}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{e.latency}</div>
              </div>
            ))}
          </div>
        </div>

        {/* EC2 Instances */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">EC2 Instance Traffic</div>
            <div className="card-badge live">CloudWatch</div>
          </div>
          <div>
            {INSTANCE_DATA.map((inst, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < INSTANCE_DATA.length - 1 ? "1px solid var(--border-dim)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>{inst.id}</span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{inst.type} · {inst.az}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: "8px", alignItems: "center" }}>
                  <div className="proto-track">
                    <div
                      className="proto-fill"
                      style={{
                        width: `${inst.cpu}%`,
                        background: inst.cpu > 70 ? "var(--accent-orange)" : "linear-gradient(90deg, var(--accent-green), var(--accent-cyan))"
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "right" }}>
                    CPU {inst.cpu}%
                  </div>
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Net: <span style={{ color: "var(--accent-cyan)" }}>{inst.net}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
