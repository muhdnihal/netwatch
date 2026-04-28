const API_URL = "https://41ugiuyys3.execute-api.eu-north-1.amazonaws.com/prod";

export async function fetchLogs() {
  try {
    const res = await fetch(`${API_URL}/api/logs`);
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.error("fetchLogs error:", err);
    return [];
  }
}

export async function fetchAlerts() {
  try {
    const res = await fetch(`${API_URL}/api/alerts`);
    const data = await res.json();
    return data.findings || [];
  } catch (err) {
    console.error("fetchAlerts error:", err);
    return [];
  }
}

export async function fetchMetrics() {
  try {
    const res = await fetch(`${API_URL}/api/metrics`);
    const data = await res.json();
    return data || {};
  } catch (err) {
    console.error("fetchMetrics error:", err);
    return {};
  }
}

export async function fetchQueueStats() {
  try {
    const res = await fetch(`${API_URL}/api/queue-stats`);
    const data = await res.json();
    return data || {};
  } catch (err) {
    console.error("fetchQueueStats error:", err);
    return {};
  }
}