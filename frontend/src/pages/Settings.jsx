import { useState } from "react";

function ToggleRow({ name, desc, initial }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="toggle-row">
      <div className="toggle-info">
        <div className="toggle-name">{name}</div>
        <div className="toggle-desc">{desc}</div>
      </div>
      <button className={`toggle-switch ${on ? "on" : ""}`} onClick={() => setOn(!on)} />
    </div>
  );
}

const AWS_SERVICES = [
  { 
    name: "VPC Flow Logs", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:logs:eu-north-1:800080992729:log-group:/netwatch/vpc-flow-logs" 
  },
  { 
    name: "GuardDuty", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:guardduty:eu-north-1:800080992729:detector/abc123" 
  },
  { 
    name: "AWS Config", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:config:eu-north-1:800080992729:config-rule/netwatch-config" 
  },
  { 
    name: "Shield Standard", 
    status: "active", 
    region: "global", 
    arn: "arn:aws:shield::800080992729:protection/netwatch" 
  },
  { 
    name: "Amazon SQS", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:sqs:eu-north-1:800080992729:netwatch-traffic-queue" 
  },
  { 
    name: "CloudWatch", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:cloudwatch:eu-north-1:800080992729:dashboard/NetWatch-Traffic-Monitor" 
  },
  { 
    name: "AWS Lambda", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:lambda:eu-north-1:800080992729:function:net-traffic-processor" 
  },
  { 
    name: "Amazon SNS", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:sns:eu-north-1:800080992729:netwatch-alerts" 
  },
  { 
    name: "Amazon S3", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:s3:::netwatch-flow-logs-nihal-2026" 
  },
  { 
    name: "Amazon Athena", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:athena:eu-north-1:800080992729:workgroup/netwatch" 
  },
  { 
    name: "AWS CloudFront", 
    status: "active", 
    region: "global", 
    arn: "arn:aws:cloudfront::800080992729:distribution/ADD-AFTER-CREATED" 
  },
  { 
    name: "API Gateway", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:apigateway:eu-north-1::/restapis/ADD-AFTER-CREATED" 
  },
  { 
    name: "DynamoDB", 
    status: "active", 
    region: "eu-north-1", 
    arn: "arn:aws:dynamodb:eu-north-1:800080992729:table/netwatch-traffic-logs" 
  },
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
        <div className="page-subtitle">AWS Services · Notifications · Thresholds · IAM</div>
      </div>

      <div className="grid-2 section-gap">
        {/* AWS Config */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">AWS Configuration</div>
            <div className="card-badge live">Connected</div>
          </div>
          <div className="form-group">
            <label className="form-label">AWS Region</label>
            <select className="form-select">
              <option>us-east-1 (N. Virginia)</option>
              <option>us-west-2 (Oregon)</option>
              <option>eu-west-1 (Ireland)</option>
              <option>ap-southeast-1 (Singapore)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">VPC ID</label>
            <input className="form-input" defaultValue="vpc-0a1b2c3d4e5f67890" />
          </div>
          <div className="form-group">
            <label className="form-label">S3 Bucket (Flow Logs)</label>
            <input className="form-input" defaultValue="netwatch-flow-logs-bucket" />
          </div>
          <div className="form-group">
            <label className="form-label">CloudWatch Log Group</label>
            <input className="form-input" defaultValue="/aws/vpc/flow-logs" />
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
            <label className="form-label">Traffic Spike Threshold (GB/s)</label>
            <input className="form-input" type="number" defaultValue="5" />
          </div>
          <div className="form-group">
            <label className="form-label">Failed Auth Attempts (per minute)</label>
            <input className="form-input" type="number" defaultValue="100" />
          </div>
          <div className="form-group">
            <label className="form-label">Latency Threshold (ms)</label>
            <input className="form-input" type="number" defaultValue="200" />
          </div>
          <div className="form-group">
            <label className="form-label">SNS Topic ARN</label>
            <input className="form-input" defaultValue="arn:aws:sns:us-east-1:123456789:netwatch-alerts" />
          </div>
          <div className="form-group">
            <label className="form-label">Alert Email</label>
            <input className="form-input" type="email" defaultValue="admin@example.com" />
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
        <ToggleRow name="VPC Flow Log Capture" desc="Capture all inbound/outbound traffic via S3 + CloudWatch" initial={true} />
        <ToggleRow name="GuardDuty Threat Detection" desc="AI-powered threat intelligence and anomaly detection" initial={true} />
        <ToggleRow name="Real-time Kinesis Stream" desc="Sub-second latency log streaming via Kinesis Data Firehose" initial={true} />
        <ToggleRow name="SNS Alert Notifications" desc="Send email/SMS alerts on threshold breach via Amazon SNS" initial={true} />
        <ToggleRow name="CloudFront Access Logging" desc="Log all CDN requests for geo and user analysis" initial={true} />
        <ToggleRow name="Lambda Auto-Remediation" desc="Auto-invoke Lambda to block IPs on critical threat detection" initial={false} />
        <ToggleRow name="Macie Data Sensitivity Scan" desc="Scan S3 log buckets for PII and sensitive data exposure" initial={false} />
        <ToggleRow name="Security Hub Aggregation" desc="Centralize findings from all security services in Security Hub" initial={true} />
      </div>

      {/* AWS Services Status */}
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">Connected AWS Services ({AWS_SERVICES.length})</div>
          <div className="card-badge live">All Systems Operational</div>
        </div>
        <div className="table-scroll" style={{ maxHeight: "320px" }}>
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
                  <td style={{ color: "var(--accent-cyan)", fontWeight: "700" }}>{s.name}</td>
                  <td>{s.region}</td>
                  <td>
                    <span className="action-tag ALLOW">● {s.status}</span>
                  </td>
                  <td style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.arn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: "rgba(255,51,102,0.2)" }}>
        <div className="card-header">
          <div className="card-title" style={{ color: "var(--accent-red)" }}>Danger Zone</div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn btn-danger">Reset All Alerts</button>
          <button className="btn btn-danger">Clear Flow Log Cache</button>
          <button className="btn btn-danger">Disable All Monitoring</button>
        </div>
      </div>
    </div>
  );
}
