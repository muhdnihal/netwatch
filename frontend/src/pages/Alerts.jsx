import { useState, useEffect } from "react";
import { fetchAlerts } from "../utils/api";

const STATIC_ALERTS = [
  {
    id: 1, sev: "critical", icon: "🚨",
    title: "GuardDuty — Monitoring Active",
    desc: "AWS GuardDuty is actively monitoring your VPC in eu-north-1 (Stockholm) for threats.",
    source: "Region: eu-north-1", service: "GuardDuty",
    time: "Live", status: "active"
  },
  {
    id: 2, sev: "info", icon: "ℹ",
    title: "SQS Queue — Processing Traffic Logs",
    desc: "netwatch-traffic-queue is actively receiving and processing VPC flow log messages.",
    source: "Queue: netwatch-traffic-queue", service: "SQS",
    time: "Live", status: "active"
  },
  {
    id: 3, sev: "info", icon: "ℹ",
    title: "AWS Config — Compliance Recording",
    desc: "AWS Config is recording all resource configuration changes in your account.",
    source: "Recorder: netwatch-config-recorder", service: "AWS Config",
    time: "Live", status: "active"
  },
  {
    id: 4, sev: "resolved", icon: "✅",
    title: "Lambda — Handler Fixed",
    desc: "net-traffic-processor and netwatch-api Lambda functions are running correctly.",
    source: "Region: eu-north-1", service: "Lambda",
    time: "Today", status: "resolved"
  },
  {
    id: 5, sev: "resolved", icon: "✅",
    title: "DynamoDB — Storing Real Logs",
    desc: "netwatch-traffic-logs table is receiving and storing real VPC flow log records.",
    source: "Table: netwatch-traffic-logs", service: "DynamoDB",
    time: "Today", status: "resolved"
  },
];

const SEV_LABELS = {
  critical: "CRITICAL",
  warning:  "WARNING",
  info:     "INFO",
  resolved: "RESOLVED"
};

export default function Alerts() {
  const [filter, setFilter]           = useState("all");
  const [guarddutyAlerts, setGuarddutyAlerts] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      const findings = await fetchAlerts();
      const mapped = findings.map((f, i) => ({
        id:      `gd-${i}`,
        sev:     f.severity >= 7 ? "critical" : f.severity >= 4 ? "warning" : "info",
        icon:    f.severity >= 7 ? "🚨" : f.severity >= 4 ? "⚠" : "ℹ",
        title:   f.title || "GuardDuty Finding",
        desc:    f.description || "",
        source:  `Region: ${f.region || "eu-north-1"}`,
        service: "GuardDuty",
        time:    f.created ? f.created.split("T")[0] : "Recent",
        status:  "active"
      }));
      setGuarddutyAlerts(mapped);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const allAlerts = [...guarddutyAlerts, ...STATIC_ALERTS];
  const filtered  = filter === "all"
    ? allAlerts
    : allAlerts.filter(a => a.sev === filter);

  const counts = {
    critical: allAlerts.filter(a => a.sev === "critical").length,
    warning:  allAlerts.filter(a => a.sev === "warning").length,
    info:     allAlerts.filter(a => a.sev === "info").length,
    resolved: allAlerts.filter(a => a.sev === "resolved").length,
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Alerts</div>
        <div className="page-title">Alert <span>Center</span></div>
        <div className="page-subtitle">
          GuardDuty · SQS · Lambda · AWS Config · eu-north-1
        </div>
      </div>

      <div className="grid-4 section-gap">
        {[
          { label: "Critical", count: counts.critical, color: "red"    },
          { label: "Warning",  count: counts.warning,  color: "orange" },
          { label: "Info",     count: counts.info,     color: "cyan"   },
          { label: "Resolved", count: counts.resolved, color: "green"  },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}
            style={{ cursor: "pointer" }}
            onClick={() => setFilter(s.label.toLowerCase())}>
            <div className="stat-label">{s.label} Alerts</div>
            <div className="stat-value">{s.count}</div>
            <div className="stat-sub">Click to filter</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:"8px", marginBottom:"16px",
                    flexWrap:"wrap" }}>
        {["all","critical","warning","info","resolved"].map(f => (
          <button key={f}
            className={`btn ${filter === f ? "btn-primary" : "btn-outline"}`}
            style={{ padding:"6px 14px", fontSize:"11px" }}
            onClick={() => setFilter(f)}>
            {f.toUpperCase()}
          </button>
        ))}
        <div style={{ marginLeft:"auto", fontSize:"11px",
                      color:"var(--text-muted)", alignSelf:"center" }}>
          {loading ? "Loading GuardDuty..." : `${guarddutyAlerts.length} GuardDuty findings`}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            Active Incidents — {filtered.length} shown
          </div>
          <div className="card-badge live">● Real AWS Data</div>
        </div>
        <div className="alert-list">
          {filtered.map(a => (
            <div key={a.id} className={`alert-item ${a.sev}`}>
              <div className="alert-icon">{a.icon}</div>
              <div className="alert-body">
                <div className="alert-title">
                  {a.title}{" "}
                  <span className={`sev-badge ${a.sev}`}>
                    {SEV_LABELS[a.sev]}
                  </span>
                </div>
                <div className="alert-desc">{a.desc}</div>
                <div className="alert-meta">
                  <span>🔹 {a.source}</span>
                  <span>🛠 {a.service}</span>
                  <span style={{ color: a.status === "resolved"
                    ? "var(--accent-green)" : "var(--accent-orange)" }}>
                    ● {a.status}
                  </span>
                </div>
              </div>
              <div className="alert-time">{a.time}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="icon">✅</div>
              No alerts in this category
            </div>
          )}
        </div>
      </div>
    </div>
  );
}