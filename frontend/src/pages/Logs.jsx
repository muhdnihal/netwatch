import { useState, useEffect } from "react";
import { fetchLogs } from "../utils/api";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLogs = async () => {
    const data = await fetchLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(loadLogs, 5000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  const filtered = logs.filter(l => {
    const matchSearch = !filter ||
      (l.src_ip && l.src_ip.includes(filter)) ||
      (l.dst_ip && l.dst_ip.includes(filter)) ||
      (l.protocol && l.protocol.includes(filter.toUpperCase()));
    const matchAction = actionFilter === "ALL" ||
      (l.action && l.action.toUpperCase() === actionFilter);
    return matchSearch && matchAction;
  });

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Flow Logs</div>
        <div className="page-title">VPC <span>Flow Logs</span></div>
        <div className="page-subtitle">
          Real data from DynamoDB · eu-north-1 · auto-refresh 5s
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px",
                    alignItems: "center", flexWrap: "wrap" }}>
        <input
          className="form-input"
          placeholder="Filter by IP, protocol..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ maxWidth: "260px" }}
        />
        {["ALL", "ALLOW", "DENY", "REJECT", "MONITOR"].map(a => (
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
      </div>

      <div className="grid-4 section-gap">
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Total Logs</div>
          <div className="stat-value"
               style={{ fontSize: "20px", color: "var(--accent-cyan)" }}>
            {filtered.length}
          </div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Allowed</div>
          <div className="stat-value"
               style={{ fontSize: "20px", color: "var(--accent-green)" }}>
            {filtered.filter(l =>
              l.action && l.action.toUpperCase() === "ALLOW").length}
          </div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Denied</div>
          <div className="stat-value"
               style={{ fontSize: "20px", color: "var(--accent-red)" }}>
            {filtered.filter(l =>
              l.action && ["DENY","REJECT"].includes(
                l.action.toUpperCase())).length}
          </div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="stat-label">Last Updated</div>
          <div className="stat-value"
               style={{ fontSize: "14px", color: "var(--accent-orange)" }}>
            {loading ? "Loading..." : new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            Real Flow Log Records — {filtered.length} entries
          </div>
          {autoRefresh && <div className="card-badge live">● LIVE</div>}
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="icon">⏳</div>
            Loading real data from AWS DynamoDB...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            No logs yet — send a message to SQS to generate logs!
          </div>
        ) : (
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
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={i} className={
                    l.action && ["DENY","REJECT"].includes(
                      l.action.toUpperCase()) ? "critical" : ""
                  }>
                    <td>{l.timestamp ?
                      l.timestamp.split("T")[1].split(".")[0] : "-"}
                    </td>
                    <td style={{ color: "var(--accent-cyan)" }}>
                      {l.src_ip || "-"}
                    </td>
                    <td>{l.dst_ip || "-"}</td>
                    <td>{l.src_port || "-"}</td>
                    <td style={{ color:
                      l.dst_port === "22" ?
                      "var(--accent-orange)" : "inherit" }}>
                      {l.dst_port || "-"}
                    </td>
                    <td>{l.protocol || "-"}</td>
                    <td>{l.bytes || "-"}</td>
                    <td>
                      <span className={`action-tag ${
                        l.action && ["DENY","REJECT"].includes(
                          l.action.toUpperCase()) ? "DENY" :
                        l.action ? l.action.toUpperCase() : "ALLOW"
                      }`}>
                        {l.action || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}