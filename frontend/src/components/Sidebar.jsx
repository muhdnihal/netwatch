import { useState, useEffect } from "react";

const API_URL = "https://41ugiuyys3.execute-api.eu-north-1.amazonaws.com/prod";

export default function Sidebar({ activePage, setActivePage, isOpen }) {
  const [alertCount, setAlertCount] = useState(0);
  const [logCount,   setLogCount]   = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // fetch real alert count from GuardDuty
        const alertRes = await fetch(`${API_URL}/api/alerts`);
        const alertData = await alertRes.json();
        setAlertCount((alertData.findings || []).length);

        // fetch real log count from DynamoDB
        const logRes = await fetch(`${API_URL}/api/logs`);
        const logData = await logRes.json();
        setLogCount(logData.count || 0);
      } catch (err) {
        console.error("Sidebar fetch error:", err);
      }
    };

    fetchCounts();
    const t = setInterval(fetchCounts, 10000);
    return () => clearInterval(t);
  }, []);

  const navItems = [
    { id: "dashboard", icon: "⬡", label: "Dashboard" },
    { id: "analytics", icon: "◈", label: "Analytics" },
    {
      id: "alerts", icon: "◉", label: "Alerts",
      badge: alertCount > 0 ? alertCount : null
    },
    {
      id: "logs", icon: "≡", label: "Flow Logs",
      badge: logCount > 0 ? logCount : null
    },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🛡</div>
        {isOpen && <div className="logo-text">NET<span>WATCH</span></div>}
      </div>

      <nav className="sidebar-nav">
        {isOpen && (
          <div className="nav-section-label">Navigation</div>
        )}
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
            {isOpen && item.badge && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot-wrapper">
          <div className="status-dot" />
          {isOpen && (
            <span>
              AWS eu-north-1
              {logCount > 0 && (
                <span style={{ color:"var(--accent-cyan)",
                               marginLeft:"6px" }}>
                  · {logCount} logs
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
