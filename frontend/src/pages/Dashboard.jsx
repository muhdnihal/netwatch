import { useState, useEffect } from "react";
const API_URL = "https://bl38xozute.execute-api.eu-north-1.amazonaws.com/prod";
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
  const labels = ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"];
  const maxVal = 100;
  return (
    <div>
      <div className="chart-container">
        {data.map((d, i) => (
          <div key={i} className="chart-bar-group" style={{ position: "relative" }}>
            <div
              className="chart-bar incoming"
              style={{ height: `${(d.in / maxVal) * 85}%`, marginBottom: "2px" }}
              title={`Inbound: ${d.in} Mbps`}
            />
            <div
              className="chart-bar outgoing"
              style={{ height: `${(d.out / maxVal) * 85}%` }}
              title={`Outbound: ${d.out} Mbps`}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
        {labels.map((l, i) => (
          <div key={i} className="chart-label" style={{ flex: 1, textAlign: "center" }}>{l}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
          <div style={{ width: "12px", height: "4px", background: "var(--accent-cyan)", borderRadius: "2px" }} />
          Inbound Traffic
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
          <div style={{ width: "12px", height: "4px", background: "var(--accent-green)", borderRadius: "2px" }} />
          Outbound Traffic
        </div>
      </div>
    </div>
  );
}

function GeoTable({ items }) {
  return (
    <div className="geo-table">
      {items.map((item, i) => (
        <div key={i} className="geo-row">
          <div className="flag">{item.flag}</div>
          <div className="geo-country">{item.country}</div>
          <div className="geo-packets">{item.packets}</div>
          <div className="geo-bar-wrapper" style={{ gridColumn: "1 / -1" }}>
            <div className="geo-bar-track">
              <div className="geo-bar-fill" style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProtocolBreakdown({ protocols }) {
  const colors = [
    "linear-gradient(90deg, #00d4ff, #0d7bb5)",
    "linear-gradient(90deg, #00ff9d, #00b870)",
    "linear-gradient(90deg, #ff6b35, #cc4400)",
    "linear-gradient(90deg, #bd00ff, #7a00cc)",
    "linear-gradient(90deg, #ffd700, #cc9900)",
  ];
  return (
    <div className="protocol-grid">
      {protocols.map((p, i) => (
        <div key={i} className="protocol-row">
          <div className="protocol-name">{p.name}</div>
          <div className="proto-track">
            <div className="proto-fill" style={{ width: `${p.pct}%`, background: colors[i % colors.length] }} />
          </div>
          <div className="protocol-pct">{p.pct}%</div>
        </div>
      ))}
    </div>
  );
}

function LiveFeed({ events }) {
  return (
    <div className="live-feed">
      {events.map((e, i) => (
        <div key={i} className="feed-item">
          <div className="feed-time">{e.time}</div>
          <div className="feed-ip">
            {e.src} <span>→</span> {e.dst}
          </div>
          <div className="feed-bytes">{e.bytes}</div>
        </div>
      ))}
    </div>
  );
}

function NetworkMap() {
  const nodes = [
    { type: "internet", icon: "🌐", label: "Internet", x: 6, y: 30 },
    { type: "firewall", icon: "🔥", label: "WAF", x: 25, y: 30 },
    { type: "loadbalancer", icon: "⚖", label: "ALB", x: 44, y: 30 },
    { type: "server", icon: "◈", label: "EC2 Cluster", x: 63, y: 10 },
    { type: "database", icon: "⬡", label: "RDS", x: 63, y: 55 },
    { type: "client", icon: "◉", label: "Lambda", x: 80, y: 30 },
  ];

  const edges = [
    [0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5]
  ];

  return (
    <div className="map-container">
      <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map(([a, b], i) => {
          const na = nodes[a], nb = nodes[b];
          return (
            <line
              key={i}
              x1={`${na.x + 3}%`} y1={`${na.y + 6}%`}
              x2={`${nb.x + 3}%`} y2={`${nb.y + 6}%`}
              stroke="rgba(0,212,255,0.2)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          );
        })}
      </svg>
      {nodes.map((n, i) => (
        <div
          key={i}
          className={`map-node ${n.type}`}
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          <div className="map-node-circle">{n.icon}</div>
          <div className="map-node-label">{n.label}</div>
        </div>
      ))}
    </div>
  );
}

const GEO = [
  { flag: "🇺🇸", country: "United States", packets: "42.8K req/s", pct: 88 },
  { flag: "🇩🇪", country: "Germany", packets: "18.2K req/s", pct: 42 },
  { flag: "🇸🇬", country: "Singapore", packets: "11.9K req/s", pct: 27 },
  { flag: "🇬🇧", country: "United Kingdom", packets: "8.4K req/s", pct: 19 },
  { flag: "🇯🇵", country: "Japan", packets: "5.1K req/s", pct: 12 },
];

const PROTOCOLS = [
  { name: "HTTPS", pct: 64 },
  { name: "HTTP", pct: 18 },
  { name: "DNS", pct: 8 },
  { name: "SSH", pct: 6 },
  { name: "Other", pct: 4 },
];

function genFeedEvent() {
  const ips = ["10.0.1.", "172.16.0.", "192.168.1.", "34.210.", "54.171."];
  const src = ips[rand(0, 4)] + rand(1, 254);
  const dst = ips[rand(0, 4)] + rand(1, 254);
  const bytes = `${rand(1, 999)} KB`;
  const h = String(rand(0, 23)).padStart(2, "0");
  const m = String(rand(0, 59)).padStart(2, "0");
  const s = String(rand(0, 59)).padStart(2, "0");
  return { time: `${h}:${m}:${s}`, src, dst, bytes };
}

function genChartData() {
  return Array.from({ length: 12 }, () => ({ in: rand(20, 100), out: rand(10, 80) }));
}

export default function Dashboard() {
  const [chartData, setChartData] = useState(genChartData());
  const [feed, setFeed] = useState(Array.from({ length: 12 }, genFeedEvent));
  const [traffic, setTraffic] = useState({ in: "2.31", out: "1.04", total: "18.7" });

  useInterval(() => {
    setChartData(genChartData());
    setFeed(prev => [genFeedEvent(), ...prev.slice(0, 18)]);
    setTraffic({
      in: (Math.random() * 3 + 1).toFixed(2),
      out: (Math.random() * 2 + 0.5).toFixed(2),
      total: (Math.random() * 10 + 14).toFixed(1),
    });
  }, 3000);

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Dashboard</div>
        <div className="page-title">Network <span>Overview</span></div>
        <div className="page-subtitle">Real-time monitoring · AWS VPC · us-east-1 · auto-refresh 3s</div>
      </div>

      {/* STAT CARDS */}
      <div className="grid-4 section-gap">
        <StatCard
          label="Inbound Traffic"
          value={`${traffic.in} GB/s`}
          sub="↑ +12% vs last hour"
          icon="⬇"
          color="cyan"
          trend="up"
        />
        <StatCard
          label="Outbound Traffic"
          value={`${traffic.out} GB/s`}
          sub="↓ -3% vs last hour"
          icon="⬆"
          color="green"
          trend="down"
        />
        <StatCard
          label="Active Connections"
          value={`${rand(800, 1200)}`}
          sub={`${rand(30,60)} new in last 60s`}
          icon="⬡"
          color="purple"
          trend=""
        />
        <StatCard
          label="Threat Detections"
          value={`${rand(2,8)}`}
          sub="⚠ 3 critical today"
          icon="◉"
          color="red"
          trend=""
        />
      </div>

      <div className="grid-2 section-gap">
        {/* TRAFFIC CHART */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">24h Traffic Bandwidth</div>
            <div className="card-badge live">● LIVE</div>
          </div>
          <TrafficChart data={chartData} />
        </div>

        {/* GEO TABLE */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Source Countries</div>
            <div className="card-badge live">CloudFront</div>
          </div>
          <GeoTable items={GEO} />
        </div>
      </div>

      <div className="grid-3 section-gap">
        {/* PROTOCOL */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Protocol Distribution</div>
          </div>
          <ProtocolBreakdown protocols={PROTOCOLS} />
        </div>

        {/* NETWORK MAP */}
        <div className="card span-2">
          <div className="card-header">
            <div className="card-title">AWS Architecture Map</div>
            <div className="card-badge live">● LIVE</div>
          </div>
          <NetworkMap />
        </div>
      </div>

      {/* LIVE FEED */}
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">Live Packet Feed</div>
          <div className="card-badge live">● Real-time</div>
        </div>
        <LiveFeed events={feed} />
      </div>
    </div>
  );
}
