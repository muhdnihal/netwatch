import { useState } from "react";

const ALERTS = [
  {
    id: 1, sev: "critical", icon: "🚨",
    title: "DDoS Attack Detected",
    desc: "High-volume SYN flood from 192.168.0.0/16 targeting port 443. AWS Shield Advanced activated.",
    source: "IP: 192.168.44.12", service: "Shield Advanced",
    time: "2 min ago", status: "active"
  },
  {
    id: 2, sev: "critical", icon: "🔴",
    title: "Brute Force SSH Attempt",
    desc: "1,240 failed SSH login attempts detected in 60s from 45.33.32.156. EC2 instance i-0abc123.",
    source: "IP: 45.33.32.156", service: "GuardDuty",
    time: "8 min ago", status: "active"
  },
  {
    id: 3, sev: "warning", icon: "⚠",
    title: "Unusual Data Exfiltration",
    desc: "Outbound traffic spike: 4.7 GB transferred to 203.0.113.0/24 outside normal business hours.",
    source: "VPC: vpc-0abc", service: "Macie",
    time: "22 min ago", status: "investigating"
  },
  {
    id: 4, sev: "warning", icon: "🟠",
    title: "Security Group Misconfiguration",
    desc: "Port 0.0.0.0/0 is open on sg-0def456. Inbound traffic from all IPs allowed on port 8080.",
    source: "SG: sg-0def456", service: "Security Hub",
    time: "1 hr ago", status: "investigating"
  },
  {
    id: 5, sev: "info", icon: "ℹ",
    title: "CloudFront Geo-Restriction Triggered",
    desc: "403 responses issued for 2,841 requests from restricted regions (CN, RU, KP).",
    source: "Distribution: E1ABCDEF", service: "CloudFront",
    time: "2 hr ago", status: "active"
  },
  {
    id: 6, sev: "resolved", icon: "✅",
    title: "Lambda Throttling Resolved",
    desc: "net-traffic-processor Lambda throttled for 4 minutes. Concurrency limit increased to 500.",
    source: "Function: net-traffic-processor", service: "Lambda",
    time: "4 hr ago", status: "resolved"
  },
  {
    id: 7, sev: "resolved", icon: "✅",
    title: "WAF Rule Triggered & Mitigated",
    desc: "SQLi attempt blocked by WAF rule group. 847 malformed requests dropped automatically.",
    source: "WebACL: netwatch-acl", service: "WAF",
    time: "6 hr ago", status: "resolved"
  },
];

const SEV_LABELS = { critical: "CRITICAL", warning: "WARNING", info: "INFO", resolved: "RESOLVED" };

export default function Alerts() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? ALERTS : ALERTS.filter(a => a.sev === filter);

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Alerts</div>
        <div className="page-title">Alert <span>Center</span></div>
        <div className="page-subtitle">AWS GuardDuty · Shield · SecurityHub · Macie · WAF</div>
      </div>

      {/* Summary stats */}
      <div className="grid-4 section-gap">
        {[
          { label: "Critical", count: 2, color: "red" },
          { label: "Warning", count: 2, color: "orange" },
          { label: "Info", count: 1, color: "cyan" },
          { label: "Resolved", count: 2, color: "green" },
        ].map((s) => (
          <div
            key={s.label}
            className={`stat-card ${s.color}`}
            style={{ cursor: "pointer" }}
            onClick={() => setFilter(s.label.toLowerCase())}
          >
            <div className="stat-label">{s.label} Alerts</div>
            <div className="stat-value">{s.count}</div>
            <div className="stat-sub">Click to filter</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["all", "critical", "warning", "info", "resolved"].map(f => (
          <button
            key={f}
            className={`btn ${filter === f ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "6px 14px", fontSize: "11px" }}
            onClick={() => setFilter(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
        <button
          className="btn btn-outline"
          style={{ marginLeft: "auto", fontSize: "11px", padding: "6px 14px" }}
        >
          ↓ Export CSV
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Active Incidents — {filtered.length} shown</div>
          <div className="card-badge warn">SNS Notifications On</div>
        </div>
        <div className="alert-list">
          {filtered.map(a => (
            <div key={a.id} className={`alert-item ${a.sev}`}>
              <div className="alert-icon">{a.icon}</div>
              <div className="alert-body">
                <div className="alert-title">
                  {a.title}
                  {" "}
                  <span className={`sev-badge ${a.sev}`}>{SEV_LABELS[a.sev]}</span>
                </div>
                <div className="alert-desc">{a.desc}</div>
                <div className="alert-meta">
                  <span>🔹 {a.source}</span>
                  <span>🛠 {a.service}</span>
                  <span style={{ color: a.status === "resolved" ? "var(--accent-green)" : "var(--accent-orange)" }}>
                    ● {a.status}
                  </span>
                </div>
              </div>
              <div className="alert-time">{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
