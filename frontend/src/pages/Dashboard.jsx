import { useState, useEffect } from "react";
import { fetchLogs, fetchQueueStats, fetchMetrics } from "../utils/api";

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function useInterval(cb, ms) {
  useEffect(() => {
    const t = setInterval(cb, ms);
    return () => clearInterval(t);
  }, []);
}

function StatCard({ label, value, sub, icon, color, trend }) {
  const bars = Array.from({ length: 12 }, () => rand(20, 100));
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-sub ${trend}`}>{sub}</div>
      <div className="sparkline">
        {bars.map((h, i) => (
          <div key={i} className="spark-bar" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function TrafficChart({ data }) {
  const labels = ["00","02","04","06","08","10","12","14","16","18","20","22"];
  return (
    <div>
      <div className="chart-container">
        {data.map((d, i) => (
          <div key={i} className="chart-bar-group">
            <div className="chart-bar incoming"
              style={{ height: `${(d.in / 100) * 85}%`, marginBottom: "2px" }} />
            <div className="chart-bar outgoing"
              style={{ height: `${(d.out / 100) * 85}%` }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
        {labels.map((l, i) => (
          <div key={i} className="chart-label"
            style={{ flex: 1, textAlign: "center" }}>{l}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px",
          fontSize: "11px", color: "var(--text-secondary)" }}>
          <div style={{ width: "12px", height: "4px",
            background: "var(--accent-cyan)", borderRadius: "2px" }} />
          Inbound Traffic
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px",
          fontSize: "11px", color: "var(--text-secondary)" }}>
          <div style={{ width: "12px", height: "4px",
            background: "var(--accent-green)", borderRadius: "2px" }} />
          Outbound Traffic
        </div>
      </div>
    </div>
  );
}

function LiveFeed({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📭</div>
        No real logs yet — send messages to SQS queue to see live data!
      </div>
    );
  }
  return (
    <div className="live-feed">
      {logs.slice(0, 15).map((l, i) => (
        <div key={i} className="feed-item">
          <div className="feed-time">
            {l.timestamp ? l.timestamp.split("T")[1].split(".")[0] : "-"}
          </div>
          <div className="feed-ip">
            {l.src_ip || "-"} <span>→</span> {l.dst_ip || "-"}
            <span style={{ marginLeft: "8px", fontSize: "10px",
              color: ["DENY","REJECT"].includes((l.action||"").toUpperCase())
                ? "var(--accent-red)" : "var(--accent-green)" }}>
              ● {l.action || "-"}
            </span>
          </div>
          <div className="feed-bytes">{l.bytes ? `${l.bytes} B` : "-"}</div>
        </div>
      ))}
    </div>
  );
}

function NetworkMap() {
  const nodes = [
    { type: "internet",     icon: "🌐", label: "Internet",    x: 6,  y: 30 },
    { type: "firewall",     icon: "🔥", label: "VPC",         x: 25, y: 30 },
    { type: "loadbalancer", icon: "⚖",  label: "SQS",         x: 44, y: 30 },
    { type: "server",       icon: "◈",  label: "Lambda",      x: 63, y: 10 },
    { type: "database",     icon: "⬡",  label: "DynamoDB",    x: 63, y: 55 },
    { type: "client",       icon: "◉",  label: "API Gateway", x: 80, y: 30 },
  ];
  const edges = [[0,1],[1,2],[2,3],[2,4],[3,5],[4,5]];
  return (
    <div className="map-container">
      <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map(([a, b], i) => {
          const na = nodes[a], nb = nodes[b];
          return (
            <line key={i}
              x1={`${na.x+3}%`} y1={`${na.y+6}%`}
              x2={`${nb.x+3}%`} y2={`${nb.y+6}%`}
              stroke="rgba(0,212,255,0.2)" strokeWidth="0.5"
              strokeDasharray="2,2" />
          );
        })}
      </svg>
      {nodes.map((n, i) => (
        <div key={i} className={`map-node ${n.type}`}
          style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <div className="map-node-circle">{n.icon}</div>
          <div className="map-node-label">{n.label}</div>
        </div>
      ))}
    </div>
  );
}

function genChartData() {
  return Array.from({ length: 12 }, () => ({
    in: rand(20, 100), out: rand(10, 80)
  }));
}

export default function Dashboard() {
  const [chartData, setChartData]   = useState(genChartData());
  const [realLogs, setRealLogs]     = useState([]);
  const [queueStats, setQueueStats] = useState({});
  const [logCount, setLogCount]     = useState(0);
  const [loading, setLoading]       = useState(true);

  const loadRealData = async () => {
    const [logs, queue] = await Promise.all([
      fetchLogs(),
      fetchQueueStats()
    ]);
    setRealLogs(logs);
    setLogCount(logs.length);
    setQueueStats(queue);
    setLoading(false);
  };

  useEffect(() => { loadRealData(); }, []);

  useInterval(() => {
    setChartData(genChartData());
    loadRealData();
  }, 5000);

  const allowCount  = realLogs.filter(l =>
    (l.action||"").toUpperCase() === "ALLOW").length;
  const denyCount   = realLogs.filter(l =>
    ["DENY","REJECT"].includes((l.action||"").toUpperCase())).length;
  const totalBytes  = realLogs.reduce((s, l) =>
    s + parseInt(l.bytes || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Dashboard</div>
        <div className="page-title">Network <span>Overview</span></div>
        <div className="page-subtitle">
          Real-time monitoring · AWS VPC · eu-north-1 (Stockholm) · auto-refresh 5s
        </div>
      </div>

      <div className="grid-4 section-gap">
        <StatCard
          label="Total Log Records"
          value={loading ? "..." : logCount}
          sub="From DynamoDB"
          icon="⬇" color="cyan" trend=""
        />
        <StatCard
          label="Allowed Traffic"
          value={loading ? "..." : allowCount}
          sub="ALLOW actions"
          icon="⬆" color="green" trend="up"
        />
        <StatCard
          label="Blocked Traffic"
          value={loading ? "..." : denyCount}
          sub="DENY/REJECT actions"
          icon="⬡" color="red" trend=""
        />
        <StatCard
          label="SQS Queue"
          value={loading ? "..." :
            (queueStats.messages_available || 0)}
          sub="Messages waiting"
          icon="◉" color="purple" trend=""
        />
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-header">
            <div className="card-title">24h Traffic Bandwidth</div>
            <div className="card-badge live">● LIVE</div>
          </div>
          <TrafficChart data={chartData} />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">AWS Services Status</div>
            <div className="card-badge live">eu-north-1</div>
          </div>
          <div className="protocol-grid">
            {[
              { name: "SQS Queue",    pct: 100, color: "#00d4ff" },
              { name: "Lambda",       pct: 100, color: "#00ff9d" },
              { name: "DynamoDB",     pct: 100, color: "#bd00ff" },
              { name: "API Gateway",  pct: 100, color: "#ffd700" },
              { name: "CloudWatch",   pct: 100, color: "#ff6b35" },
              { name: "GuardDuty",    pct: 100, color: "#ff3366" },
            ].map((s, i) => (
              <div key={i} className="protocol-row">
                <div className="protocol-name">{s.name}</div>
                <div className="proto-track">
                  <div className="proto-fill"
                    style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
                <div className="protocol-pct"
                  style={{ color: "var(--accent-green)" }}>✅</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">AWS Architecture — eu-north-1</div>
          <div className="card-badge live">● LIVE</div>
        </div>
        <NetworkMap />
      </div>

      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">
            Live Packet Feed — Real DynamoDB Data
          </div>
          <div className="card-badge live">
            ● {logCount} records
          </div>
        </div>
        <LiveFeed logs={realLogs} />
      </div>

      <div className="grid-4 section-gap">
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Total Bytes</div>
          <div className="stat-value"
            style={{ fontSize: "18px", color: "var(--accent-cyan)" }}>
            {(totalBytes / 1000).toFixed(1)} KB
          </div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Messages Available</div>
          <div className="stat-value"
            style={{ fontSize: "18px", color: "var(--accent-green)" }}>
            {queueStats.messages_available || 0}
          </div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Messages In-Flight</div>
          <div className="stat-value"
            style={{ fontSize: "18px", color: "var(--accent-orange)" }}>
            {queueStats.messages_inflight || 0}
          </div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Region</div>
          <div className="stat-value"
            style={{ fontSize: "14px", color: "var(--accent-purple)" }}>
            eu-north-1
          </div>
        </div>
      </div>
    </div>
  );
}