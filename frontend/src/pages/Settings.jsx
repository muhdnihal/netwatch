import { useState } from "react";

// ── Toggle Row ──────────────────────────────────────────────────────────────
function ToggleRow({ name, desc, initial }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="toggle-row">
      <div className="toggle-info">
        <div className="toggle-name">{name}</div>
        <div className="toggle-desc">{desc}</div>
      </div>
      <button
        className={`toggle-switch ${on ? "on" : ""}`}
        onClick={() => setOn(!on)}
      />
    </div>
  );
}

// ── Confirmation Modal ──────────────────────────────────────────────────────
function ConfirmModal({ action, onConfirm, onCancel }) {
  if (!action) return null;

  const config = {
    "reset-alerts": {
      title:   "Reset All Alerts?",
      message: "This will clear all active GuardDuty findings and SNS alert history. This action cannot be undone.",
      label:   "Reset Alerts",
      icon:    "🔔",
    },
    "clear-cache": {
      title:   "Clear Flow Log Cache?",
      message: "This will flush all cached VPC flow log entries from the processing queue and DynamoDB buffer. Live data will resume automatically.",
      label:   "Clear Cache",
      icon:    "🗑️",
    },
    "disable-all": {
      title:   "Disable ALL Monitoring?",
      message: "This will stop Lambda processors, pause SQS consumption, and halt all GuardDuty scans. Your AWS infrastructure will be unmonitored until re-enabled.",
      label:   "Disable Everything",
      icon:    "⚠️",
    },
  };

  const c = config[action];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,.75)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn .15s ease",
    }}>
      <div style={{
        background: "#0d1627",
        border: "1px solid rgba(255,51,102,.35)",
        borderRadius: "14px",
        padding: "32px",
        maxWidth: "420px", width: "90%",
        boxShadow: "0 0 60px rgba(255,51,102,.15)",
        animation: "slideUp .2s ease",
      }}>
        <div style={{ fontSize: "2.4rem", marginBottom: "12px" }}>{c.icon}</div>
        <div style={{
          fontFamily: "var(--mono, monospace)",
          fontSize: "1rem", fontWeight: 700,
          color: "#ff3366", marginBottom: "12px",
          letterSpacing: ".04em",
        }}>{c.title}</div>
        <p style={{
          fontSize: ".84rem", color: "#8899aa",
          lineHeight: 1.65, marginBottom: "24px",
        }}>{c.message}</p>

        {/* Type to confirm for disable-all */}
        {action === "disable-all" && (
          <ConfirmInput onReady={onConfirm} onCancel={onCancel} label={c.label} />
        )}

        {action !== "disable-all" && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: "10px",
                background: "transparent",
                border: "1px solid #1a2a45",
                color: "#8899aa", borderRadius: "8px",
                cursor: "pointer", fontFamily: "var(--mono, monospace)",
                fontSize: ".78rem",
                transition: "border-color .2s",
              }}
              onMouseEnter={e => e.target.style.borderColor = "#8899aa"}
              onMouseLeave={e => e.target.style.borderColor = "#1a2a45"}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1, padding: "10px",
                background: "rgba(255,51,102,.15)",
                border: "1px solid rgba(255,51,102,.5)",
                color: "#ff3366", borderRadius: "8px",
                cursor: "pointer", fontFamily: "var(--mono, monospace)",
                fontSize: ".78rem", fontWeight: 700,
                transition: "background .2s",
              }}
              onMouseEnter={e => e.target.style.background = "rgba(255,51,102,.25)"}
              onMouseLeave={e => e.target.style.background = "rgba(255,51,102,.15)"}
            >
              {c.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Require typing "CONFIRM" for the most destructive action
function ConfirmInput({ onReady, onCancel, label }) {
  const [val, setVal] = useState("");
  const ready = val === "CONFIRM";
  return (
    <div>
      <p style={{ fontSize: ".76rem", color: "#ff3366", marginBottom: "8px", fontFamily: "var(--mono, monospace)" }}>
        Type <strong>CONFIRM</strong> to proceed:
      </p>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="CONFIRM"
        style={{
          width: "100%", padding: "9px 12px",
          background: "rgba(255,51,102,.06)",
          border: "1px solid rgba(255,51,102,.3)",
          borderRadius: "8px", color: "#fff",
          fontFamily: "var(--mono, monospace)", fontSize: ".82rem",
          marginBottom: "16px", outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: "10px",
            background: "transparent", border: "1px solid #1a2a45",
            color: "#8899aa", borderRadius: "8px",
            cursor: "pointer", fontFamily: "var(--mono, monospace)", fontSize: ".78rem",
          }}
        >Cancel</button>
        <button
          onClick={ready ? onReady : undefined}
          disabled={!ready}
          style={{
            flex: 1, padding: "10px",
            background: ready ? "rgba(255,51,102,.2)" : "rgba(255,51,102,.05)",
            border: `1px solid ${ready ? "rgba(255,51,102,.5)" : "rgba(255,51,102,.15)"}`,
            color: ready ? "#ff3366" : "#552233",
            borderRadius: "8px",
            cursor: ready ? "pointer" : "not-allowed",
            fontFamily: "var(--mono, monospace)", fontSize: ".78rem", fontWeight: 700,
            transition: "all .2s",
          }}
        >{label}</button>
      </div>
    </div>
  );
}

// ── Toast notification ──────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px",
      zIndex: 10000, display: "flex", flexDirection: "column", gap: "10px",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: "12px 18px",
          background: t.type === "success" ? "rgba(0,255,157,.1)" : "rgba(255,51,102,.1)",
          border: `1px solid ${t.type === "success" ? "rgba(0,255,157,.3)" : "rgba(255,51,102,.3)"}`,
          borderRadius: "10px",
          color: t.type === "success" ? "#00ff9d" : "#ff3366",
          fontFamily: "var(--mono, monospace)", fontSize: ".78rem",
          boxShadow: "0 8px 32px rgba(0,0,0,.4)",
          animation: "slideUp .3s ease",
          maxWidth: "320px",
        }}>
          {t.type === "success" ? "✓" : "⚠"} {t.message}
        </div>
      ))}
    </div>
  );
}

// ── AWS Services list ───────────────────────────────────────────────────────
const AWS_SERVICES = [
  { name: "VPC Flow Logs",          status: "active",  region: "eu-north-1", arn: "arn:aws:logs:eu-north-1:800809927294:log-group:/netwatch/vpc-flow-logs" },
  { name: "Amazon SQS",             status: "active",  region: "eu-north-1", arn: "arn:aws:sqs:eu-north-1:800809927294:netwatch-traffic-queue" },
  { name: "AWS Lambda (Processor)", status: "active",  region: "eu-north-1", arn: "arn:aws:lambda:eu-north-1:800809927294:function:net-traffic-processor" },
  { name: "AWS Lambda (API)",       status: "active",  region: "eu-north-1", arn: "arn:aws:lambda:eu-north-1:800809927294:function:netwatch-api" },
  { name: "DynamoDB",               status: "active",  region: "eu-north-1", arn: "arn:aws:dynamodb:eu-north-1:800809927294:table/netwatch-traffic-logs" },
  { name: "Amazon SNS",             status: "active",  region: "eu-north-1", arn: "arn:aws:sns:eu-north-1:800809927294:netwatch-alerts" },
  { name: "API Gateway",            status: "active",  region: "eu-north-1", arn: "arn:aws:execute-api:eu-north-1:800809927294:41ugiuyys3/prod" },
  { name: "CloudWatch",             status: "active",  region: "eu-north-1", arn: "arn:aws:cloudwatch:eu-north-1:800809927294:dashboard/NetWatch-Traffic-Monitor" },
  { name: "Amazon S3 (Logs)",       status: "active",  region: "eu-north-1", arn: "arn:aws:s3:::netwatch-flow-logs-nihal-2026" },
  { name: "Amazon S3 (Frontend)",   status: "active",  region: "eu-north-1", arn: "arn:aws:s3:::netwatch-frontend-nihal-2026" },
  { name: "GuardDuty",              status: "active",  region: "eu-north-1", arn: "arn:aws:guardduty:eu-north-1:800809927294:detector/active" },
  { name: "AWS Config",             status: "active",  region: "eu-north-1", arn: "arn:aws:config:eu-north-1:800809927294:config-rule/netwatch-config" },
  { name: "AWS CloudFront",         status: "pending", region: "global",     arn: "arn:aws:cloudfront::800809927294:distribution/PENDING-VERIFICATION" },
];

// ── Main Settings component ─────────────────────────────────────────────────
export default function Settings() {
  const [saved, setSaved]           = useState(false);
  const [modal, setModal]           = useState(null);   // "reset-alerts" | "clear-cache" | "disable-all"
  const [toasts, setToasts]         = useState([]);
  const [monitoring, setMonitoring] = useState(true);   // tracks global monitoring state
  const [loading, setLoading]       = useState(null);   // which action is in progress

  // ── Toast helper
  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // ── Save settings
  const handleSave = () => {
    setSaved(true);
    addToast("Configuration saved successfully.");
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Danger Zone handlers
  const handleDangerConfirm = async () => {
    setLoading(modal);
    setModal(null);

    // Simulate async API call (replace with real AWS SDK calls)
    await new Promise(r => setTimeout(r, 1200));

    if (loading === "reset-alerts" || modal === null && loading === "reset-alerts") {
      addToast("All alerts have been reset. GuardDuty findings cleared.");
    } else if (loading === "clear-cache") {
      addToast("Flow log cache cleared. SQS queue flushed.");
    } else if (loading === "disable-all") {
      setMonitoring(false);
      addToast("⚠ All monitoring disabled. Re-enable from toggles.", "error");
    }

    setLoading(null);
  };

  // Inline version so modal is still in scope when confirm fires
  const confirmAction = async (actionKey) => {
    setLoading(actionKey);

    await new Promise(r => setTimeout(r, 1200));

    if (actionKey === "reset-alerts") {
      addToast("All alerts have been reset. GuardDuty findings cleared.");
    } else if (actionKey === "clear-cache") {
      addToast("Flow log cache cleared. SQS queue flushed.");
    } else if (actionKey === "disable-all") {
      setMonitoring(false);
      addToast("⚠ All monitoring disabled. Re-enable from toggles.", "error");
    }

    setLoading(null);
    setModal(null);
  };

  // ── Danger button style
  const dangerBtn = (key) => ({
    padding: "9px 20px",
    background: loading === key ? "rgba(255,51,102,.05)" : "rgba(255,51,102,.1)",
    border: "1px solid rgba(255,51,102,.35)",
    color: loading === key ? "#552233" : "#ff3366",
    borderRadius: "8px",
    cursor: loading === key ? "not-allowed" : "pointer",
    fontFamily: "var(--mono, monospace)",
    fontSize: ".78rem", fontWeight: 700,
    letterSpacing: ".06em",
    transition: "all .2s",
    display: "flex", alignItems: "center", gap: "8px",
  });

  return (
    <div>
      {/* ── Keyframe styles injected once */}
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .danger-btn:hover:not(:disabled) {
          background: rgba(255,51,102,.2) !important;
          box-shadow: 0 0 16px rgba(255,51,102,.2);
        }
        .spinner {
          width:12px; height:12px;
          border:2px solid rgba(255,51,102,.3);
          border-top-color:#ff3366;
          border-radius:50%;
          animation:spin .7s linear infinite;
        }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>

      {/* ── Page header */}
      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Settings</div>
        <div className="page-title">System <span>Configuration</span></div>
        <div className="page-subtitle">
          eu-north-1 (Stockholm) · Account: 800809927294
        </div>
      </div>

      <div className="grid-2 section-gap">
        {/* AWS Config */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">AWS Configuration</div>
            <div className="card-badge live">Connected ✅</div>
          </div>
          <div className="form-group">
            <label className="form-label">AWS Region</label>
            <select className="form-select">
              <option>eu-north-1 (Stockholm) ← YOUR REGION</option>
              <option>us-east-1 (N. Virginia)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Account ID</label>
            <input className="form-input" defaultValue="800809927294" readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">SQS Queue URL</label>
            <input className="form-input"
              defaultValue="https://sqs.eu-north-1.amazonaws.com/800809927294/netwatch-traffic-queue" />
          </div>
          <div className="form-group">
            <label className="form-label">S3 Flow Logs Bucket</label>
            <input className="form-input" defaultValue="netwatch-flow-logs-nihal-2026" />
          </div>
          <div className="form-group">
            <label className="form-label">API Gateway URL</label>
            <input className="form-input"
              defaultValue="https://41ugiuyys3.execute-api.eu-north-1.amazonaws.com/prod" />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-primary" onClick={handleSave}>
              {saved ? "✓ Saved!" : "Save Changes"}
            </button>
            <button className="btn btn-outline">Test Connection</button>
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Alert Thresholds</div>
          </div>
          <div className="form-group">
            <label className="form-label">Traffic Spike Threshold (bytes)</label>
            <input className="form-input" type="number" defaultValue="10000000" />
          </div>
          <div className="form-group">
            <label className="form-label">Failed Auth Attempts (per batch)</label>
            <input className="form-input" type="number" defaultValue="100" />
          </div>
          <div className="form-group">
            <label className="form-label">SNS Topic ARN</label>
            <input className="form-input"
              defaultValue="arn:aws:sns:eu-north-1:800809927294:netwatch-alerts" />
          </div>
          <div className="form-group">
            <label className="form-label">DynamoDB Table</label>
            <input className="form-input" defaultValue="netwatch-traffic-logs" />
          </div>
          <div className="form-group">
            <label className="form-label">Athena Database</label>
            <input className="form-input" defaultValue="netwatch_db" />
          </div>
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? "✓ Saved!" : "Update Thresholds"}
          </button>
        </div>
      </div>

      {/* Monitoring Toggles */}
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">Monitoring Features</div>
          {!monitoring && (
            <div className="card-badge" style={{ background:"rgba(255,51,102,.1)", color:"#ff3366", border:"1px solid rgba(255,51,102,.3)" }}>
              ⚠ DISABLED
            </div>
          )}
        </div>
        <ToggleRow name="SQS Traffic Queue"        desc="Receive VPC flow log messages via netwatch-traffic-queue"                    initial={monitoring} />
        <ToggleRow name="Lambda Processing"         desc="net-traffic-processor Lambda processes SQS messages"                        initial={monitoring} />
        <ToggleRow name="DynamoDB Storage"          desc="Store all processed logs in netwatch-traffic-logs table"                    initial={monitoring} />
        <ToggleRow name="SNS Alert Notifications"   desc="Send email alerts on threat detection via Amazon SNS"                       initial={monitoring} />
        <ToggleRow name="GuardDuty Threat Detection" desc="AI-powered threat intelligence in eu-north-1"                             initial={monitoring} />
        <ToggleRow name="AWS Config Compliance"     desc="Record all resource configuration changes"                                  initial={monitoring} />
        <ToggleRow name="CloudWatch Metrics"        desc="Push BytesProcessed and LogRecordsProcessed metrics"                       initial={monitoring} />
        <ToggleRow name="CloudFront CDN"            desc="Pending account verification — will enable soon"                           initial={false} />
      </div>

      {/* AWS Services Status */}
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">Connected AWS Services ({AWS_SERVICES.length})</div>
          <div className="card-badge live">eu-north-1 Stockholm</div>
        </div>
        <div className="table-scroll" style={{ maxHeight: "380px" }}>
          <table className="log-table">
            <thead>
              <tr>
                <th>SERVICE</th><th>REGION</th><th>STATUS</th><th>ARN</th>
              </tr>
            </thead>
            <tbody>
              {AWS_SERVICES.map((s, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--accent-cyan)", fontWeight: "700" }}>{s.name}</td>
                  <td>{s.region}</td>
                  <td>
                    <span className={`action-tag ${s.status === "active" ? "ALLOW" : "MONITOR"}`}>
                      ● {s.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.arn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Danger Zone ──────────────────────────────────────────────────────── */}
      <div className="card" style={{ borderColor: "rgba(255,51,102,0.25)", marginTop: "24px" }}>
        <div className="card-header">
          <div className="card-title" style={{ color: "#ff3366" }}>
            ⚠ Danger Zone
          </div>
          <div style={{
            fontSize: ".72rem", color: "#ff3366", opacity: .6,
            fontFamily: "var(--mono, monospace)",
          }}>
            These actions are irreversible
          </div>
        </div>

        {/* Descriptions + buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>

          {/* Row 1 — Reset Alerts */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 0", borderBottom: "1px solid rgba(255,51,102,.1)",
          }}>
            <div>
              <div style={{ fontSize: ".84rem", fontWeight: 600, marginBottom: "3px" }}>
                Reset All Alerts
              </div>
              <div style={{ fontSize: ".75rem", color: "#8899aa" }}>
                Clears all active GuardDuty findings and SNS alert history
              </div>
            </div>
            <button
              className="danger-btn"
              style={dangerBtn("reset-alerts")}
              disabled={loading === "reset-alerts"}
              onClick={() => setModal("reset-alerts")}
            >
              {loading === "reset-alerts"
                ? <><div className="spinner" /> Resetting…</>
                : "Reset All Alerts"}
            </button>
          </div>

          {/* Row 2 — Clear Cache */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 0", borderBottom: "1px solid rgba(255,51,102,.1)",
          }}>
            <div>
              <div style={{ fontSize: ".84rem", fontWeight: 600, marginBottom: "3px" }}>
                Clear Flow Log Cache
              </div>
              <div style={{ fontSize: ".75rem", color: "#8899aa" }}>
                Flushes VPC flow log cache and SQS message buffer
              </div>
            </div>
            <button
              className="danger-btn"
              style={dangerBtn("clear-cache")}
              disabled={loading === "clear-cache"}
              onClick={() => setModal("clear-cache")}
            >
              {loading === "clear-cache"
                ? <><div className="spinner" /> Clearing…</>
                : "Clear Flow Log Cache"}
            </button>
          </div>

          {/* Row 3 — Disable All */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 0",
          }}>
            <div>
              <div style={{ fontSize: ".84rem", fontWeight: 600, marginBottom: "3px" }}>
                Disable All Monitoring
              </div>
              <div style={{ fontSize: ".75rem", color: "#8899aa" }}>
                Stops all Lambda processors, SQS consumption and GuardDuty scans
              </div>
            </div>
            <button
              className="danger-btn"
              style={dangerBtn("disable-all")}
              disabled={loading === "disable-all"}
              onClick={() => setModal("disable-all")}
            >
              {loading === "disable-all"
                ? <><div className="spinner" /> Disabling…</>
                : "Disable All Monitoring"}
            </button>
          </div>

        </div>
      </div>

      {/* ── Confirmation Modal */}
      <ConfirmModal
        action={modal}
        onCancel={() => setModal(null)}
        onConfirm={() => confirmAction(modal)}
      />

      {/* ── Toast notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}