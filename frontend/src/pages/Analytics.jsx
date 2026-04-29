import { useState, useEffect } from "react";
import { fetchLogs, fetchMetrics, fetchQueueStats } from "../utils/api";

function LineChart({ data, color, unit, label }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height:"80px", display:"flex", alignItems:"center",
                    justifyContent:"center", color:"var(--text-muted)",
                    fontSize:"12px" }}>
        No data yet — send messages to SQS to generate metrics
      </div>
    );
  }
  const max   = Math.max(...data);
  const min   = Math.min(...data);
  const range = max - min || 1;
  const W = 100, H = 60;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return `${x},${y}`;
  });
  return (
    <div>
      <div style={{ fontSize:"11px", color:"var(--text-muted)",
                    marginBottom:"8px" }}>{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`}
        style={{ width:"100%", height:"80px", overflow:"visible" }}
        preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`}
            x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0"   />
          </linearGradient>
        </defs>
        <polyline points={pts.join(" ")} fill="none"
          stroke={color} strokeWidth="1.5" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke" />
        <polygon
          points={`0,${H} ${pts.join(" ")} ${W},${H}`}
          fill={`url(#grad-${color.replace('#','')})`} />
        {data.map((v, i) => {
          const [x, y] = pts[i].split(",");
          return <circle key={i} cx={x} cy={y} r="2"
            fill={color} vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div style={{ display:"flex", justifyContent:"space-between",
                    marginTop:"4px" }}>
        <span style={{ fontSize:"10px", color:"var(--text-muted)" }}>
          oldest
        </span>
        <span style={{ fontSize:"10px", color, fontWeight:"700" }}>
          {data[data.length-1]}{unit}
        </span>
        <span style={{ fontSize:"10px", color:"var(--text-muted)" }}>
          latest
        </span>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [logs,       setLogs]       = useState([]);
  const [metrics,    setMetrics]    = useState({});
  const [queueStats, setQueueStats] = useState({});
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const load = async () => {
      const [l, m, q] = await Promise.all([
        fetchLogs(), fetchMetrics(), fetchQueueStats()
      ]);
      setLogs(l);
      setMetrics(m);
      setQueueStats(q);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  // Build charts from real logs
  const bytesList  = logs.map(l => parseInt(l.bytes  || 0));
  const allowCount = logs.filter(l =>
    (l.action||"").toUpperCase() === "ALLOW").length;
  const denyCount  = logs.filter(l =>
    ["DENY","REJECT"].includes((l.action||"").toUpperCase())).length;
  const totalBytes = bytesList.reduce((s, b) => s + b, 0);
  const avgBytes   = logs.length ? Math.round(totalBytes / logs.length) : 0;

  // Protocol breakdown from real logs
  const protocolMap = {};
  logs.forEach(l => {
    const p = l.protocol || "OTHER";
    protocolMap[p] = (protocolMap[p] || 0) + 1;
  });
  const protocols = Object.entries(protocolMap)
    .map(([name, count]) => ({
      name,
      pct: logs.length ? Math.round((count / logs.length) * 100) : 0
    }))
    .sort((a, b) => b.pct - a.pct);

  // Port breakdown
  const portMap = {};
  logs.forEach(l => {
    const p = l.dst_port || "other";
    portMap[p] = (portMap[p] || 0) + 1;
  });
  const topPorts = Object.entries(portMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Bytes chart data
  const bytesChartData = bytesList.length > 0
    ? bytesList.slice(-12)
    : [];

  // CloudWatch metrics data
  const cwBytes = metrics.BytesProcessed
    ? (Array.isArray(metrics.BytesProcessed)
        ? metrics.BytesProcessed.map(d => d.Sum || 0)
        : [])
    : [];
  const cwRecords = metrics.LogRecordsProcessed
    ? (Array.isArray(metrics.LogRecordsProcessed)
        ? metrics.LogRecordsProcessed.map(d => d.Sum || 0)
        : [])
    : [];

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Analytics</div>
        <div className="page-title">Traffic <span>Analytics</span></div>
        <div className="page-subtitle">
          Real data · DynamoDB · CloudWatch · SQS · eu-north-1
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid-4 section-gap">
        <div className="stat-card cyan">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{loading ? "..." : logs.length}</div>
          <div className="stat-sub">From DynamoDB</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Allowed</div>
          <div className="stat-value">{loading ? "..." : allowCount}</div>
          <div className="stat-sub">ALLOW actions</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Blocked</div>
          <div className="stat-value">{loading ? "..." : denyCount}</div>
          <div className="stat-sub">DENY/REJECT</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Avg Bytes</div>
          <div className="stat-value">
            {loading ? "..." : `${(avgBytes/1000).toFixed(1)}K`}
          </div>
          <div className="stat-sub">Per record</div>
        </div>
      </div>

      <div className="grid-2 section-gap">
        {/* Bytes chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Bytes Per Log Record</div>
            <div className="card-badge live">Real DynamoDB Data</div>
          </div>
          <LineChart
            data={bytesChartData}
            color="#00d4ff"
            unit=" B"
            label="Bytes per record (latest 12)"
          />
        </div>

        {/* CloudWatch metrics */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">CloudWatch — Bytes Processed</div>
            <div className="card-badge live">CloudWatch Metrics</div>
          </div>
          <LineChart
            data={cwBytes}
            color="#00ff9d"
            unit=" B"
            label="Total bytes processed per hour"
          />
        </div>
      </div>

      <div className="grid-2 section-gap">
        {/* Protocol breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Protocol Distribution</div>
            <div className="card-badge live">Real Data</div>
          </div>
          {protocols.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📊</div>
              Send SQS messages to see protocol data
            </div>
          ) : (
            <div className="protocol-grid">
              {protocols.map((p, i) => {
                const colors = ["#00d4ff","#00ff9d","#ff6b35","#bd00ff","#ffd700"];
                return (
                  <div key={i} className="protocol-row">
                    <div className="protocol-name">{p.name}</div>
                    <div className="proto-track">
                      <div className="proto-fill"
                        style={{ width:`${p.pct}%`,
                                 background: colors[i % colors.length] }} />
                    </div>
                    <div className="protocol-pct">{p.pct}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top ports */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Destination Ports</div>
            <div className="card-badge live">Real Data</div>
          </div>
          {topPorts.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔌</div>
              Send SQS messages to see port data
            </div>
          ) : (
            <div>
              {topPorts.map(([port, count], i) => (
                <div key={i} style={{
                  display:"grid",
                  gridTemplateColumns:"80px 1fr 60px",
                  gap:"10px", alignItems:"center",
                  padding:"8px 0",
                  borderBottom: i < topPorts.length-1
                    ? "1px solid var(--border-dim)" : "none"
                }}>
                  <div style={{ fontSize:"12px",
                                color:"var(--accent-cyan)" }}>
                    Port {port}
                  </div>
                  <div className="proto-track">
                    <div className="proto-fill" style={{
                      width:`${Math.round((count/logs.length)*100)}%`,
                      background:"linear-gradient(90deg,#00d4ff,#0d7bb5)"
                    }} />
                  </div>
                  <div style={{ fontSize:"11px",
                                color:"var(--text-muted)",
                                textAlign:"right" }}>
                    {count} hits
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SQS Stats */}
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">SQS Queue Statistics</div>
          <div className="card-badge live">Real-time</div>
        </div>
        <div className="grid-4">
          <div style={{ padding:"14px", background:"var(--bg-deep)",
                        borderRadius:"8px", border:"1px solid var(--border-dim)" }}>
            <div className="stat-label">Messages Available</div>
            <div style={{ fontSize:"24px", fontWeight:"800",
                          color:"var(--accent-cyan)" }}>
              {queueStats.messages_available || 0}
            </div>
          </div>
          <div style={{ padding:"14px", background:"var(--bg-deep)",
                        borderRadius:"8px", border:"1px solid var(--border-dim)" }}>
            <div className="stat-label">Messages In-Flight</div>
            <div style={{ fontSize:"24px", fontWeight:"800",
                          color:"var(--accent-orange)" }}>
              {queueStats.messages_inflight || 0}
            </div>
          </div>
          <div style={{ padding:"14px", background:"var(--bg-deep)",
                        borderRadius:"8px", border:"1px solid var(--border-dim)" }}>
            <div className="stat-label">Total Bytes Stored</div>
            <div style={{ fontSize:"24px", fontWeight:"800",
                          color:"var(--accent-green)" }}>
              {(totalBytes/1000).toFixed(1)}KB
            </div>
          </div>
          <div style={{ padding:"14px", background:"var(--bg-deep)",
                        borderRadius:"8px", border:"1px solid var(--border-dim)" }}>
            <div className="stat-label">CloudWatch Records</div>
            <div style={{ fontSize:"24px", fontWeight:"800",
                          color:"var(--accent-purple)" }}>
              {cwRecords.reduce((s,v) => s+v, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}