import { useState, useEffect } from "react";
import { fetchLogs } from "../utils/api";

export default function Logs() {
  const [logs,          setLogs]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("");
  const [actionFilter,  setActionFilter]  = useState("ALL");
  const [autoRefresh,   setAutoRefresh]   = useState(true);
  const [lastUpdated,   setLastUpdated]   = useState(null);

  const loadLogs = async () => {
    const data = await fetchLogs();
    setLogs(data);
    setLoading(false);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  useEffect(() => { loadLogs(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(loadLogs, 5000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  const filtered = logs.filter(l => {
    const matchSearch = !filter ||
      (l.src_ip    && l.src_ip.includes(filter))    ||
      (l.dst_ip    && l.dst_ip.includes(filter))    ||
      (l.protocol  && l.protocol.includes(filter.toUpperCase()));
    const matchAction = actionFilter === "ALL" ||
      (l.action && (
        actionFilter === "DENY"
          ? ["DENY","REJECT"].includes(l.action.toUpperCase())
          : l.action.toUpperCase() === actionFilter
      ));
    return matchSearch && matchAction;
  });

  const allowCount = filtered.filter(l =>
    (l.action||"").toUpperCase() === "ALLOW").length;
  const denyCount  = filtered.filter(l =>
    ["DENY","REJECT"].includes((l.action||"").toUpperCase())).length;

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Flow Logs</div>
        <div className="page-title">VPC <span>Flow Logs</span></div>
        <div className="page-subtitle">
          Real data from DynamoDB · eu-north-1 · SQS → Lambda → DynamoDB
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"16px",
                    alignItems:"center", flexWrap:"wrap" }}>
        <input
          className="form-input"
          placeholder="Filter by IP or protocol..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ maxWidth:"260px" }}
        />
        {["ALL","ALLOW","DENY","MONITOR"].map(a => (
          <button key={a}
            className={`btn ${actionFilter===a ? "btn-primary":"btn-outline"}`}
            style={{ padding:"6px 12px", fontSize:"11px" }}
            onClick={() => setActionFilter(a)}>
            {a}
          </button>
        ))}
        <button
          className={`btn ${autoRefresh ? "btn-primary":"btn-outline"}`}
          style={{ marginLeft:"auto", padding:"6px 14px", fontSize:"11px" }}
          onClick={() => setAutoRefresh(!autoRefresh)}>
          {autoRefresh ? "⏸ Pause" : "▶ Resume"} Live
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4 section-gap">
        <div className="card" style={{ padding:"14px 16px" }}>
          <div className="stat-label">Total Records</div>
          <div className="stat-value"
            style={{ fontSize:"20px", color:"var(--accent-cyan)" }}>
            {filtered.length}
          </div>
          <div className="stat-sub">From DynamoDB</div>
        </div>
        <div className="card" style={{ padding:"14px 16px" }}>
          <div className="stat-label">Allowed</div>
          <div className="stat-value"
            style={{ fontSize:"20px", color:"var(--accent-green)" }}>
            {allowCount}
          </div>
        </div>
        <div className="card" style={{ padding:"14px 16px" }}>
          <div className="stat-label">Blocked</div>
          <div className="stat-value"
            style={{ fontSize:"20px", color:"var(--accent-red)" }}>
            {denyCount}
          </div>
        </div>
        <div className="card" style={{ padding:"14px 16px" }}>
          <div className="stat-label">Last Updated</div>
          <div className="stat-value"
            style={{ fontSize:"14px", color:"var(--accent-orange)" }}>
            {loading ? "Loading..." : lastUpdated}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            Real Flow Log Records — {filtered.length} entries
          </div>
          <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
            {autoRefresh && (
              <div className="card-badge live">● LIVE 5s</div>
            )}
            <div className="card-badge live">DynamoDB</div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="icon">⏳</div>
            Loading real data from AWS DynamoDB...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <div>No logs yet!</div>
            <div style={{ marginTop:"8px", fontSize:"11px",
                          color:"var(--text-muted)" }}>
              Go to AWS → SQS → netwatch-traffic-queue → Send message
            </div>
            <div style={{ marginTop:"6px", fontFamily:"monospace",
                          fontSize:"10px", color:"var(--accent-cyan)",
                          background:"var(--bg-deep)", padding:"8px",
                          borderRadius:"4px" }}>
              {`{"srcaddr":"192.168.1.1","dstaddr":"10.0.0.1","srcport":1234,"dstport":443,"protocol":"TCP","bytes":9000,"action":"ALLOW"}`}
            </div>
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
                    ["DENY","REJECT"].includes((l.action||"").toUpperCase())
                      ? "critical" : ""
                  }>
                    <td>
                      {l.timestamp
                        ? l.timestamp.split("T")[1]?.split(".")[0]
                        : "-"}
                    </td>
                    <td style={{ color:"var(--accent-cyan)" }}>
                      {l.src_ip || "-"}
                    </td>
                    <td>{l.dst_ip || "-"}</td>
                    <td>{l.src_port || "-"}</td>
                    <td style={{ color:
                      l.dst_port === "22"
                        ? "var(--accent-orange)" : "inherit" }}>
                      {l.dst_port || "-"}
                    </td>
                    <td>{l.protocol || "-"}</td>
                    <td>{l.bytes ? `${l.bytes} B` : "-"}</td>
                    <td>
                      <span className={`action-tag ${
                        ["DENY","REJECT"].includes(
                          (l.action||"").toUpperCase())
                          ? "DENY"
                          : (l.action||"ALLOW").toUpperCase()
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

      {/* How to add more data */}
      {!loading && filtered.length < 5 && (
        <div className="card section-gap"
          style={{ borderColor:"rgba(0,212,255,0.15)",
                   marginTop:"16px" }}>
          <div className="card-header">
            <div className="card-title"
              style={{ color:"var(--accent-cyan)" }}>
              Add More Test Data
            </div>
          </div>
          <div style={{ fontSize:"12px", color:"var(--text-secondary)",
                        lineHeight:"2" }}>
            <div>Send these messages to SQS to populate logs:</div>
            {[
              `{"srcaddr":"45.33.32.156","dstaddr":"10.0.0.1","srcport":5566,"dstport":22,"protocol":"TCP","bytes":1200,"action":"REJECT"}`,
              `{"srcaddr":"203.0.113.50","dstaddr":"10.0.0.2","srcport":8080,"dstport":80,"protocol":"TCP","bytes":50000,"action":"ALLOW"}`,
              `{"srcaddr":"185.220.101.1","dstaddr":"10.0.0.3","srcport":9999,"dstport":3306,"protocol":"TCP","bytes":300,"action":"DENY"}`,
            ].map((msg, i) => (
              <div key={i} style={{
                fontFamily:"monospace", fontSize:"10px",
                color:"var(--accent-cyan)", background:"var(--bg-deep)",
                padding:"6px 10px", borderRadius:"4px",
                marginBottom:"6px",
                border:"1px solid var(--border-dim)"
              }}>
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}