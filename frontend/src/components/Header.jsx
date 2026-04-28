import { useState, useEffect } from "react";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  analytics: "Traffic Analytics",
  alerts:    "Alert Center",
  logs:      "VPC Flow Logs",
  settings:  "Configuration",
};

export default function Header({ onToggleSidebar, activePage }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = time.toLocaleDateString("en-US", {
    month: "short", day: "2-digit", year: "numeric"
  });

  return (
    <header className="header">
      <button className="toggle-btn" onClick={onToggleSidebar}>☰</button>
      <div className="header-title">
        {PAGE_TITLES[activePage]}
        <span>eu-north-1 (Stockholm) · {dateStr} {timeStr}</span>
      </div>
      <div className="header-chips">
        <div className="chip green"><span className="chip-dot" />Monitoring Active</div>
        <div className="chip cyan">SQS + Lambda</div>
        <div className="chip red">⚠ GuardDuty ON</div>
      </div>
    </header>
  );
}