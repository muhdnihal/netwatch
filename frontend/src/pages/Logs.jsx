import { useState, useEffect } from "react";

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const randomIp = () => `${rand(10, 254)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;
const ports = [80, 443, 22, 3306, 5432, 8080, 53, 8443, 9200, 6379];
const protocols = ["TCP", "UDP", "ICMP"];
const actions = ["ALLOW", "ALLOW", "ALLOW", "DENY", "MONITOR"];

function genLog(id) {
  const ts = new Date(Date.now() - rand(0, 3600000));
  const h = String(ts.getHours()).padStart(2, "0");
  const m = String(ts.getMinutes()).padStart(2, "0");
  const s = String(ts.getSeconds()).padStart(2, "0");
  const action = actions[rand(0, actions.length - 1)];
  return {
    id,
    time: `${h}:${m}:${s}`,
    srcIp: randomIp(),
    dstIp: randomIp(),
    srcPort: rand(1024, 65535),
    dstPort: ports[rand(0, ports.length - 1)],
    protocol: protocols[rand(0, 2)],
    bytes: `${rand(64, 65535)} B`,
    packets: rand(1, 100),
    action,
    severity: action === "DENY" ? "critical" : action === "MONITOR" ? "warning" : "",
  };
}

const LOGS_INITIAL = Array.from({ length: 40 }, (_, i) => genLog(i + 1));

export default function Logs() {
  const [logs, setLogs] = useState(LOGS_INITIAL);
  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => {
      setLogs(prev => [genLog(Date.now()), ...prev.slice(0, 99)]);
    }, 2000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  const filtered = logs.filter(l => {
    const matchSearch = !filter || l.srcIp.includes(filter) || l.dstIp.includes(filter) || l.protocol.includes(filter.toUpperCase());
    const matchAction = actionFilter === "ALL" || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Flow Logs</div>
        <div className="page-title">VPC <span>Flow Logs</span></div>
        <div className="page-subtitle">S3 Bucket · Athena · CloudWatch Logs · Kinesis Firehose</div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <input
          className="form-input"
          placeholder="Filter by IP, protocol..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ maxWidth: "260px" }}
        />
        {["ALL", "ALLOW", "DENY", "MONITOR"].map(a => (
          <button
            key={a}
            className={`btn ${actionFilter === a ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "6px 12px", fontSize: "11px" }}
            onClick={() => setActionFilter(a)}
          >
            {a}
          </button>
        ))}
        <button
          className={`btn ${autoRefresh ? "btn-primary" : "btn-outline"}`}
          style={{ marginLeft: "auto", padding: "6px 14px", fontSize: "11px" }}
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          {autoRefresh ? "⏸ Pause" : "▶ Resume"} Live
        </button>
        <button
          className="btn btn-outline"
          style={{ padding: "6px 14px", fontSize: "11px" }}
        >
          ↓ Export to S3
        </button>
      </div>

      {/* Stats row */}
      <div className="grid-4 section-gap">
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Total Logs</div>
          <div className="stat-value" style={{ fontSize: "20px", color: "var(--accent-cyan)" }}>{filtered.length}</div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Allowed</div>
          <div className="stat-value" style={{ fontSize: "20px", color: "var(--accent-green)" }}>
            {filtered.filter(l => l.action === "ALLOW").length}
          </div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Denied</div>
          <div className="stat-value" style={{ fontSize: "20px", color: "var(--accent-red)" }}>
            {filtered.filter(l => l.action === "DENY").length}
          </div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Monitored</div>
          <div className="stat-value" style={{ fontSize: "20px", color: "var(--accent-orange)" }}>
            {filtered.filter(l => l.action === "MONITOR").length}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Flow Log Records — {filtered.length} entries</div>
          {autoRefresh && <div className="card-badge live">● LIVE STREAM</div>}
        </div>
        <div className="table-scroll">
          <table className="log-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>SRC IP</th>
                <th>DST IP</th>
                <th>SRC PORT</th>
                <th>DST PORT</th>
                <th>PROTOCOL</th>
                <th>BYTES</th>
                <th>PACKETS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className={l.severity}>
                  <td>{l.time}</td>
                  <td style={{ color: "var(--accent-cyan)" }}>{l.srcIp}</td>
                  <td>{l.dstIp}</td>
                  <td>{l.srcPort}</td>
                  <td style={{ color: l.dstPort === 22 ? "var(--accent-orange)" : "inherit" }}>{l.dstPort}</td>
                  <td>{l.protocol}</td>
                  <td>{l.bytes}</td>
                  <td>{l.packets}</td>
                  <td><span className={`action-tag ${l.action}`}>{l.action}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
