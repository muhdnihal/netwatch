import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./styles.css";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pages = {
    dashboard: <Dashboard />,
    alerts: <Alerts />,
    analytics: <Analytics />,
    logs: <Logs />,
    settings: <Settings />,
  };

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={sidebarOpen} />
      <div className="main-area">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} activePage={activePage} />
        <main className="page-content">{pages[activePage]}</main>
      </div>
    </div>
  );
}
