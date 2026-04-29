import { useState } from "react";

function ToggleRow({ name, desc, initial }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="toggle-row">
      <div className="toggle-info">
        <div className="toggle-name">{name}</div>
        <div className="toggle-desc">{desc}</div>
      </div>
      <button className={`toggle-switch ${on ? "on" : ""}`}
        onClick={() => setOn(!on)} />
    </div>
  );
}

const AWS_SERVICES = [
  { name: "VPC Flow Logs",    status: "active", region: "eu-north-1",
    arn: "arn:aws:logs:eu-north-1:800809927294:log-group:/netwatch/vpc-flow-logs" },
  { name: "Amazon SQS",       status: "active", region: "eu-north-1",
    arn: "arn:aws:sqs:eu-north-1:800809927294:netwatch-traffic-queue" },
  { name: "AWS Lambda (Processor)", status: "active", region: "eu-north-1",
    arn: "arn:aws:lambda:eu-north-1:800809927294:function:net-traffic-processor" },
  { name: "AWS Lambda (API)", status: "active", region: "eu-north-1",
    arn: "arn:aws:lambda:eu-north-1:800809927294:function:netwatch-api" },
  { name: "DynamoDB",         status: "active", region: "eu-north-1",
    arn: "arn:aws:dynamodb:eu-north-1:800809927294:table/netwatch-traffic-logs" },
  { name: "Amazon SNS",       status: "active", region: "eu-north-1",
    arn: "arn:aws:sns:eu-north-1:800809927294:netwatch-alerts" },
  { name: "API Gateway",      status: "active", region: "eu-north-1",
    arn: "arn:aws:execute-api:eu-north-1:800809927294:41ugiuyys3/prod" },
  { name: "CloudWatch",       status: "active", region: "eu-north-1",
    arn: "arn:aws:cloudwatch:eu-north-1:800809927294:dashboard/NetWatch-Traffic-Monitor" },
  { name: "Amazon S3 (Logs)", status: "active", region: "eu-north-1",
    arn: "arn:aws:s3:::netwatch-flow-logs-nihal-2026" },
  { name: "Amazon S3 (Frontend)", status: "active", region: "eu-north-1",
    arn: "arn:aws:s3:::netwatch-frontend-nihal-2026" },
  { name: "GuardDuty",        status: "active", region: "eu-north-1",
    arn: "arn:aws:guardduty:eu-north-1:800809927294:detector/active" },
  { name: "AWS Config",       status: "active", region: "eu-north-1",
    arn: "arn:aws:config:eu-north-1:800809927294:config-rule/netwatch-config" },
  { name: "AWS CloudFront",   status: "pending", region: "global",
    arn: "arn:aws:cloudfront::800809927294:distribution/PENDING-VERIFICATION" },
];

export default function Settings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
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
            <input className="form-input"
              defaultValue="800809927294" readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">SQS Queue URL</label>
            <input className="form-input"
              defaultValue="https://sqs.eu-north-1.amazonaws.com/800809927294/netwatch-traffic-queue" />
          </div>
          <div className="form-group">
            <label className="form-label">S3 Flow Logs Bucket</label>
            <input className="form-input"
              defaultValue="netwatch-flow-logs-nihal-2026" />
          </div>
          <div className="form-group">
            <label className="form-label">API Gateway URL</label>
            <input className="form-input"
              defaultValue="https://41ugiuyys3.execute-api.eu-north-1.amazonaws.com/prod" />
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
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
            <label className="form-label">
              Traffic Spike Threshold (bytes)
            </label>
            <input className="form-input" type="number"
              defaultValue="10000000" />
          </div>
          <div className="form-group">
            <label className="form-label">
              Failed Auth Attempts (per batch)
            </label>
            <input className="form-input" type="number"
              defaultValue="100" />
          </div>
          <div className="form-group">
            <label className="form-label">SNS Topic ARN</label>
            <input className="form-input"
              defaultValue="arn:aws:sns:eu-north-1:800809927294:netwatch-alerts" />
          </div>
          <div className="form-group">
            <label className="form-label">DynamoDB Table</label>
            <input className="form-input"
              defaultValue="netwatch-traffic-logs" />
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
        </div>
        <ToggleRow
          name="SQS Traffic Queue"
          desc="Receive VPC flow log messages via netwatch-traffic-queue"
          initial={true} />
        <ToggleRow
          name="Lambda Processing"
          desc="net-traffic-processor Lambda processes SQS messages"
          initial={true} />
        <ToggleRow
          name="DynamoDB Storage"
          desc="Store all processed logs in netwatch-traffic-logs table"
          initial={true} />
        <ToggleRow
          name="SNS Alert Notifications"
          desc="Send email alerts on threat detection via Amazon SNS"
          initial={true} />
        <ToggleRow
          name="GuardDuty Threat Detection"
          desc="AI-powered threat intelligence in eu-north-1"
          initial={true} />
        <ToggleRow
          name="AWS Config Compliance"
          desc="Record all resource configuration changes"
          initial={true} />
        <ToggleRow
          name="CloudWatch Metrics"
          desc="Push BytesProcessed and LogRecordsProcessed metrics"
          initial={true} />
        <ToggleRow
          name="CloudFront CDN"
          desc="Pending account verification — will enable soon"
          initial={false} />
      </div>

      {/* AWS Services Status */}
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">
            Connected AWS Services ({AWS_SERVICES.length})
          </div>
          <div className="card-badge live">eu-north-1 Stockholm</div>
        </div>
        <div className="table-scroll" style={{ maxHeight:"380px" }}>
          <table className="log-table">
            <thead>
              <tr>
                <th>SERVICE</th>
                <th>REGION</th>
                <th>STATUS</th>
                <th>ARN</th>
              </tr>
            </thead>
            <tbody>
              {AWS_SERVICES.map((s, i) => (
                <tr key={i}>
                  <td style={{ color:"var(--accent-cyan)",
                               fontWeight:"700" }}>{s.name}</td>
                  <td>{s.region}</td>
                  <td>
                    <span className={`action-tag ${
                      s.status === "active" ? "ALLOW" : "MONITOR"
                    }`}>
                      ● {s.status}
                    </span>
                  </td>
                  <td style={{ fontSize:"10px",
                               color:"var(--text-muted)" }}>{s.arn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    

      {/* Danger Zone */}
      <div className="card"
        style={{ borderColor:"rgba(255,51,102,0.2)" }}>
        <div className="card-header">
          <div className="card-title"
            style={{ color:"var(--accent-red)" }}>Danger Zone</div>
        </div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          <button className="btn btn-danger">Reset All Alerts</button>
          <button className="btn btn-danger">Clear Flow Log Cache</button>
          <button className="btn btn-danger">Disable All Monitoring</button>
        </div>
      </div>
    </div>
  );
}