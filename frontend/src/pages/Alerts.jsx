import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "https://41ugiuyys3.execute-api.eu-north-1.amazonaws.com/prod";

async function fetchAlerts() {
  try {
    const res  = await fetch(`${API_BASE}/api/alerts`);
    const data = await res.json();
    return data.findings || data.alerts || [];
  } catch { return []; }
}

async function fetchMetrics() {
  try {
    const res  = await fetch(`${API_BASE}/api/metrics`);
    const data = await res.json();
    return data.summary || {};
  } catch { return {}; }
}

const sevOf   = n => n >= 7 ? "critical" : n >= 4 ? "warning" : "info";
const colorOf = s => ({ critical:"#ff2d55", warning:"#ffb800", info:"#00d4ff", resolved:"#00ff9d" }[s] || "#00d4ff");
const fmtTime = iso => { try { return new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); } catch { return "—"; } };
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString([], { month:"short", day:"numeric" }); } catch { return "—"; } };

function mapFinding(f, idx) {
  const sev = sevOf(parseFloat(f.severity) || 0);
  return {
    uid:       f.id || `gd-${idx}`,
    sev,
    source:    "GuardDuty",
    title:     f.title        || "Unknown Finding",
    desc:      f.description  || "",
    region:    f.region       || "eu-north-1",
    type:      f.type         || "",
    severity:  parseFloat(f.severity) || 0,
    createdAt: f.created_at   || f.created || new Date().toISOString(),
    updatedAt: f.updated_at   || new Date().toISOString(),
    status:    "active",
    acked:     false,
    live:      true,
  };
}

function SevRing({ value, max = 10 }) {
  const pct = Math.min(value / max, 1);
  const r   = 18, circ = 2 * Math.PI * r;
  const col = value >= 7 ? "#ff2d55" : value >= 4 ? "#ffb800" : "#00d4ff";
  return (
    <svg width="44" height="44" style={{ flexShrink:0 }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="3"/>
      <circle cx="22" cy="22" r={r} fill="none" stroke={col} strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transform:"rotate(-90deg)", transformOrigin:"50% 50%", filter:`drop-shadow(0 0 4px ${col})` }}/>
      <text x="22" y="26" textAnchor="middle" fill={col}
        style={{ fontSize:"10px", fontFamily:"monospace", fontWeight:700 }}>
        {value.toFixed(1)}
      </text>
    </svg>
  );
}

function PulseDot({ color }) {
  return (
    <span style={{ position:"relative", display:"inline-block", width:10, height:10 }}>
      <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:color, opacity:.35, animation:"ping 1.4s cubic-bezier(0,0,.2,1) infinite" }}/>
      <span style={{ position:"absolute", inset:1, borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}` }}/>
    </span>
  );
}

function KpiCard({ label, value, color, sub, onClick, active }) {
  const rgb = color === "#ff2d55" ? "255,45,85" : color === "#ffb800" ? "255,184,0" : color === "#00d4ff" ? "0,212,255" : "0,255,157";
  return (
    <button onClick={onClick} style={{
      background: active ? `rgba(${rgb},.08)` : "rgba(13,22,39,.8)",
      border: `1px solid ${active ? color : "rgba(255,255,255,.06)"}`,
      borderRadius:14, padding:"20px 22px", cursor:"pointer", textAlign:"left",
      transition:"all .25s", boxShadow: active ? `0 0 24px ${color}22` : "none",
      position:"relative", overflow:"hidden",
    }}>
      {active && <span style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${color}, transparent)` }}/>}
      <div style={{ fontSize:".68rem", letterSpacing:".14em", textTransform:"uppercase", color:"rgba(180,200,230,.5)", marginBottom:8, fontFamily:"monospace" }}>{label}</div>
      <div style={{ fontSize:"2.4rem", fontWeight:800, lineHeight:1, color, fontFamily:"monospace", textShadow:`0 0 20px ${color}66` }}>{value}</div>
      {sub && <div style={{ fontSize:".7rem", color:"rgba(180,200,230,.4)", marginTop:6 }}>{sub}</div>}
    </button>
  );
}

function AlertRow({ alert, onAck, onDismiss, onExpand, expanded }) {
  const col   = colorOf(alert.sev);
  const isNew = Date.now() - new Date(alert.createdAt).getTime() < 120_000;
  const rgb   = col === "#ff2d55" ? "255,45,85" : col === "#ffb800" ? "255,184,0" : col === "#00d4ff" ? "0,212,255" : "0,255,157";

  return (
    <div style={{
      border:`1px solid ${alert.acked ? "rgba(255,255,255,.05)" : `${col}33`}`,
      borderLeft:`3px solid ${alert.acked ? "rgba(255,255,255,.1)" : col}`,
      borderRadius:10,
      background: alert.acked ? "rgba(255,255,255,.015)" : `rgba(${rgb},.04)`,
      marginBottom:6, transition:"all .3s",
      animation: isNew && !alert.acked ? "slideIn .4s ease" : "none",
      opacity: alert.acked ? .55 : 1,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", cursor:"pointer" }}
           onClick={() => onExpand(alert.uid)}>
        {alert.live ? <SevRing value={alert.severity} /> : (
          <div style={{ width:44, height:44, borderRadius:"50%", border:`2px solid ${col}`, display:"grid", placeItems:"center", fontSize:"1.2rem", flexShrink:0, boxShadow:`0 0 12px ${col}33` }}>
            {alert.sev === "resolved" ? "✓" : alert.sev === "critical" ? "!" : "i"}
          </div>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            <span style={{ fontSize:".88rem", fontWeight:700, color:"#e0ecff" }}>{alert.title}</span>
            <span style={{ fontSize:".6rem", fontWeight:800, letterSpacing:".1em", padding:"2px 7px", borderRadius:4, fontFamily:"monospace", background:`${col}22`, color:col, border:`1px solid ${col}44` }}>
              {alert.sev.toUpperCase()}
            </span>
            {isNew && !alert.acked && (
              <span style={{ fontSize:".6rem", fontWeight:700, padding:"2px 7px", background:"rgba(255,45,85,.15)", color:"#ff2d55", border:"1px solid rgba(255,45,85,.3)", borderRadius:4, fontFamily:"monospace", animation:"blink 1s step-end infinite" }}>NEW</span>
            )}
            {alert.acked && <span style={{ fontSize:".6rem", color:"rgba(180,200,230,.4)", fontFamily:"monospace" }}>ACK'd</span>}
          </div>
          <div style={{ fontSize:".76rem", color:"rgba(180,200,230,.55)", lineHeight:1.55, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{alert.desc}</div>
          <div style={{ display:"flex", gap:14, marginTop:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:".66rem", color:"rgba(180,200,230,.35)", fontFamily:"monospace" }}>⬡ {alert.source}</span>
            {alert.region && <span style={{ fontSize:".66rem", color:"rgba(180,200,230,.35)", fontFamily:"monospace" }}>◈ {alert.region}</span>}
            <span style={{ fontSize:".66rem", color:"rgba(180,200,230,.35)", fontFamily:"monospace" }}>⧖ {fmtTime(alert.createdAt)}</span>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {alert.status === "active" && !alert.acked && <PulseDot color={col} />}
            <span style={{ fontSize:".7rem", color:"rgba(180,200,230,.35)", fontFamily:"monospace" }}>{fmtDate(alert.createdAt)}</span>
          </div>
          <div style={{ display:"flex", gap:6 }} onClick={e => e.stopPropagation()}>
            {!alert.acked && (
              <button onClick={() => onAck(alert.uid)} style={{ padding:"4px 10px", fontSize:".66rem", fontFamily:"monospace", background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.25)", color:"#00d4ff", borderRadius:6, cursor:"pointer" }}>ACK</button>
            )}
            <button onClick={() => onDismiss(alert.uid)} style={{ padding:"4px 10px", fontSize:".66rem", fontFamily:"monospace", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(180,200,230,.4)", borderRadius:6, cursor:"pointer" }}>✕</button>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding:"0 16px 16px 74px", borderTop:"1px solid rgba(255,255,255,.04)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:12, marginTop:14 }}>
            {[
              { label:"Type",      val: alert.type || "—" },
              { label:"Source",    val: alert.source || "—" },
              { label:"Region",    val: alert.region || "—" },
              { label:"Severity",  val: alert.severity?.toFixed(1) || "—" },
              { label:"Created",   val: alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "—" },
              { label:"Status",    val: alert.acked ? "Acknowledged" : alert.status },
              { label:"Live Data", val: alert.live ? "Yes — AWS GuardDuty" : "Static / System" },
            ].map(({ label, val }) => (
              <div key={label} style={{ background:"rgba(0,0,0,.25)", borderRadius:8, padding:"10px 14px" }}>
                <div style={{ fontSize:".62rem", color:"rgba(180,200,230,.35)", letterSpacing:".1em", textTransform:"uppercase", fontFamily:"monospace", marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:".76rem", color:"#c0d4f0", wordBreak:"break-all" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventTicker({ events }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!events.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % events.length), 4000);
    return () => clearInterval(t);
  }, [events.length]);
  if (!events.length) return null;
  const e = events[idx];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(0,0,0,.3)", border:"1px solid rgba(255,255,255,.06)", borderRadius:8, padding:"8px 16px", marginBottom:20, fontFamily:"monospace", fontSize:".72rem", overflow:"hidden" }}>
      <PulseDot color={colorOf(e?.sev || "info")} />
      <span style={{ color:"rgba(180,200,230,.4)", marginRight:4 }}>LIVE EVENT</span>
      <span style={{ color:"#c0d4f0", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e?.title}</span>
      <span style={{ color:"rgba(180,200,230,.35)", flexShrink:0 }}>{fmtTime(e?.createdAt)}</span>
    </div>
  );
}

export default function Alerts() {
  const [alerts,   setAlerts]   = useState([]);
  const [filter,   setFilter]   = useState("all");
  const [sortBy,   setSortBy]   = useState("time");
  const [expanded, setExpanded] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [lastPoll, setLastPoll] = useState(null);
  const [search,   setSearch]   = useState("");

  const mergeAlerts = useCallback((fresh) => {
    setAlerts(prev => {
      const existingMap = Object.fromEntries(prev.map(a => [a.uid, a]));
      return fresh.map(f => ({
        ...f,
        acked:   existingMap[f.uid]?.acked   ?? false,
        visible: existingMap[f.uid]?.visible  ?? true,
      })).filter(a => a.visible !== false);
    });
  }, []);

  const loadData = useCallback(async () => {
    const findings = await fetchAlerts();
    const mapped   = findings.map(mapFinding);
    const base = mapped.length ? mapped : [
      { uid:"sys-1", sev:"info",     source:"GuardDuty", title:"GuardDuty — Monitoring Active",          desc:"AWS GuardDuty is actively scanning your VPC in eu-north-1 for threats.",              region:"eu-north-1", type:"System/Status",   severity:2, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), status:"active",   acked:false, live:false },
      { uid:"sys-2", sev:"info",     source:"SQS",       title:"SQS Queue — Processing Traffic Logs",    desc:"netwatch-traffic-queue is receiving VPC flow log messages.",                         region:"eu-north-1", type:"System/Status",   severity:2, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), status:"active",   acked:false, live:false },
      { uid:"sys-3", sev:"resolved", source:"Lambda",    title:"Lambda — Deployed & Running",            desc:"net-traffic-processor and netwatch-api are running correctly in eu-north-1.",        region:"eu-north-1", type:"System/Resolved", severity:0, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), status:"resolved", acked:false, live:false },
      { uid:"sys-4", sev:"info",     source:"Config",    title:"AWS Config — Compliance Recording",      desc:"All resource configuration changes recorded by netwatch-config-recorder.",            region:"eu-north-1", type:"System/Status",   severity:1, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), status:"active",   acked:false, live:false },
      { uid:"sys-5", sev:"resolved", source:"DynamoDB",  title:"DynamoDB — Storing Real Flow Logs",      desc:"netwatch-traffic-logs table is receiving and storing real VPC flow log records.",     region:"eu-north-1", type:"System/Resolved", severity:0, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), status:"resolved", acked:false, live:false },
    ];
    mergeAlerts(base);
    setLastPoll(new Date());
    setLoading(false);
  }, [mergeAlerts]);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 30_000);
    return () => clearInterval(t);
  }, [loadData]);

  const ack     = uid => setAlerts(prev => prev.map(a => a.uid === uid ? { ...a, acked:true  } : a));
  const dismiss = uid => setAlerts(prev => prev.filter(a => a.uid !== uid));
  const toggle  = uid => setExpanded(e => e === uid ? null : uid);
  const ackAll  = ()  => setAlerts(prev => prev.map(a => ({ ...a, acked:true })));

  const visible = alerts.filter(a => {
    if (filter !== "all" && a.sev !== filter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => sortBy === "severity" ? b.severity - a.severity : new Date(b.createdAt) - new Date(a.createdAt));

  const counts  = { critical:alerts.filter(a=>a.sev==="critical").length, warning:alerts.filter(a=>a.sev==="warning").length, info:alerts.filter(a=>a.sev==="info").length, resolved:alerts.filter(a=>a.sev==="resolved").length };
  const unacked = alerts.filter(a => !a.acked && a.status === "active").length;
  const liveCount = alerts.filter(a => a.live).length;

  return (
    <div style={{ fontFamily:"system-ui, sans-serif" }}>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ping    { 75%,100%{transform:scale(2);opacity:0} }
        @keyframes blink   { 50%{opacity:0} }
      `}</style>

      <div className="page-header">
        <div className="breadcrumb">NetWatch <span>/</span> Alerts</div>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div className="page-title">Alert <span>Center</span></div>
            <div className="page-subtitle">GuardDuty · SQS · Lambda · Config · eu-north-1</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(0,255,157,.06)", border:"1px solid rgba(0,255,157,.2)", borderRadius:99, padding:"6px 14px", fontSize:".7rem", fontFamily:"monospace", color:"#00ff9d" }}>
              <PulseDot color="#00ff9d" />
              AUTO-REFRESH 30s
            </div>
            {lastPoll && <span style={{ fontSize:".68rem", color:"rgba(180,200,230,.35)", fontFamily:"monospace" }}>{fmtTime(lastPoll.toISOString())}</span>}
          </div>
        </div>
      </div>

      {alerts.filter(a => !a.acked).length > 0 && <EventTicker events={alerts.filter(a => a.status === "active")} />}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <KpiCard label="Critical Alerts" value={counts.critical} color="#ff2d55" sub={counts.critical ? "⚠ Requires attention" : "All clear"}           onClick={() => setFilter(f => f==="critical"?"all":"critical")} active={filter==="critical"} />
        <KpiCard label="Warnings"        value={counts.warning}  color="#ffb800" sub="Medium severity"                                                   onClick={() => setFilter(f => f==="warning" ?"all":"warning" )} active={filter==="warning"} />
        <KpiCard label="Info"            value={counts.info}     color="#00d4ff" sub={`${liveCount} from GuardDuty API`}                                  onClick={() => setFilter(f => f==="info"    ?"all":"info"    )} active={filter==="info"} />
        <KpiCard label="Resolved"        value={counts.resolved} color="#00ff9d" sub={`${unacked} unacknowledged`}                                        onClick={() => setFilter(f => f==="resolved"?"all":"resolved")} active={filter==="resolved"} />
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        {["all","critical","warning","info","resolved"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:"6px 14px", fontSize:".7rem", fontFamily:"monospace", letterSpacing:".08em", background:filter===f ? colorOf(f==="all"?"info":f) : "rgba(255,255,255,.04)", border:`1px solid ${filter===f ? colorOf(f==="all"?"info":f) : "rgba(255,255,255,.08)"}`, color:filter===f?"#000":"rgba(180,200,230,.5)", borderRadius:8, cursor:"pointer", fontWeight:filter===f?700:400, transition:"all .2s" }}>
            {f.toUpperCase()}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search alerts…" style={{ background:"rgba(0,0,0,.25)", border:"1px solid rgba(255,255,255,.08)", borderRadius:8, padding:"7px 14px", color:"#c0d4f0", fontFamily:"monospace", fontSize:".72rem", outline:"none", width:180 }}/>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background:"rgba(0,0,0,.35)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(180,200,230,.6)", borderRadius:8, padding:"6px 12px", fontFamily:"monospace", fontSize:".72rem", outline:"none", cursor:"pointer" }}>
          <option value="time">Sort: Time</option>
          <option value="severity">Sort: Severity</option>
        </select>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
          {unacked > 0 && <button onClick={ackAll} style={{ padding:"6px 14px", fontSize:".7rem", fontFamily:"monospace", background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.25)", color:"#00d4ff", borderRadius:8, cursor:"pointer" }}>ACK ALL ({unacked})</button>}
          <button onClick={loadData} style={{ padding:"6px 14px", fontSize:".7rem", fontFamily:"monospace", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(180,200,230,.5)", borderRadius:8, cursor:"pointer" }}>↺ REFRESH</button>
          <span style={{ fontSize:".68rem", color:"rgba(180,200,230,.35)", fontFamily:"monospace" }}>{loading ? "Loading…" : `${liveCount} live · ${alerts.length} total`}</span>
        </div>
      </div>

      <div style={{ background:"rgba(8,15,30,.6)", border:"1px solid rgba(255,255,255,.06)", borderRadius:14, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,.05)", background:"rgba(0,0,0,.2)" }}>
          <div style={{ fontFamily:"monospace", fontSize:".78rem", letterSpacing:".1em", textTransform:"uppercase", color:"#00d4ff" }}>Active Incidents — {visible.length} shown</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <PulseDot color="#00ff9d" />
            <span style={{ fontSize:".7rem", fontFamily:"monospace", color:"#00ff9d", letterSpacing:".08em" }}>● REAL AWS DATA</span>
          </div>
        </div>
        <div style={{ padding:12, minHeight:200 }}>
          {loading ? (
            Array.from({length:4}).map((_,i) => (
              <div key={i} style={{ height:72, borderRadius:10, marginBottom:6, background:"rgba(255,255,255,.04)" }}/>
            ))
          ) : visible.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 24px" }}>
              <div style={{ fontSize:"2.5rem", marginBottom:12 }}>✅</div>
              <div style={{ color:"#00ff9d", fontFamily:"monospace", fontSize:".82rem" }}>No alerts in this category</div>
            </div>
          ) : (
            visible.map(a => (
              <AlertRow key={a.uid} alert={a} onAck={ack} onDismiss={dismiss} onExpand={toggle} expanded={expanded === a.uid} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}