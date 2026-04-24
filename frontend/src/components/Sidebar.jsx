export default function Sidebar({ activePage, setActivePage, isOpen }) {
  const navItems = [
    { id: "dashboard", icon: "⬡", label: "Dashboard" },
    { id: "analytics", icon: "◈", label: "Analytics" },
    { id: "alerts", icon: "◉", label: "Alerts", badge: 3 },
    { id: "logs", icon: "≡", label: "Flow Logs" },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🛡</div>
        {isOpen && <div className="logo-text">NET<span>WATCH</span></div>}
      </div>

      <nav className="sidebar-nav">
        {isOpen && <div className="nav-section-label">Navigation</div>}
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
            {isOpen && item.badge && <span className="nav-badge">{item.badge}</span>}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot-wrapper">
          <div className="status-dot" />
          {isOpen && <span>AWS Connected</span>}
        </div>
      </div>
    </aside>
  );
}
