"use client";
import { useEffect, useMemo, useState } from "react";

type Payload = {
  ga4MeasurementId: string;
  eventName: string;
  thresholds: string;     // "25,50,75,100" or custom
  selectors: string;      // "#footer, .cookie"
  spaFix: boolean;
  ajaxForms: boolean;
  premium: boolean;
};

const defaultThresholds = "25,50,75,100";

export default function Page() {
  // Persist "premium" in localStorage for MVP (replace with real auth later)
  const [premium, setPremium] = useState<boolean>(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem("sg_premium");
    if (v === "1") setPremium(true);
  }, []);

  const [ga4Id, setId] = useState("");
  const [eventName, setEventName] = useState("scroll_depth_custom");
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [selectors, setSelectors] = useState("#footer, .cookie, .banner, .sticky, .chat-widget");
  const [spaFix, setSpaFix] = useState(true);
  const [ajaxForms, setAjaxForms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const canGenerate = useMemo(() => ga4Id.trim().length > 0 && eventName.trim().length > 0, [ga4Id, eventName]);

  const doUnlock = (code: string) => {
    if (code.trim().toUpperCase() === "DEMO-PRO") {
      setPremium(true);
      localStorage.setItem("sg_premium", "1");
      setUnlockOpen(false);
    } else {
      alert("Invalid code");
    }
  };

  const download = (data: any, filename = "ScrollGenius_Container.json") => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (!canGenerate || busy) return;
    setBusy(true); setMsg("");
    try {
      const payload: Payload = {
        ga4MeasurementId: ga4Id.trim(),
        eventName: eventName.trim(),
        thresholds: premium ? thresholds.trim() || defaultThresholds : defaultThresholds,
        selectors: premium ? selectors.trim() : "",
        spaFix,
        ajaxForms: premium && ajaxForms,
        premium
      };
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to generate container.");
      const json = await res.json();
      download(json);
      setMsg("✅ GTM container generated.");
    } catch (e:any) {
      setMsg("❌ " + (e.message || "Error"));
    } finally { setBusy(false); }
  };

  return (
    <main className="grid" style={{gap:20}}>
      {/* Left: GTM-style editor */}
      <section className="grid grid-2" style={{alignItems:'start'}}>
        <div className="card">
          <div className="kicker">Tag settings</div>
          <div className="h2">GA4 Event – <span className="badge">ScrollGenius</span></div>

          <div className="grid" style={{gap:12, marginTop:12}}>
            <div>
              <div className="label">GA4 Measurement ID</div>
              <input className="input" placeholder="G-XXXXXXX" value={ga4Id} onChange={e=>setId(e.target.value)} />
              <div className="helper">Paste your GA4 <code className="inline">G-</code> ID.</div>
            </div>
            <div>
              <div className="label">Event name</div>
              <input className="input" value={eventName} onChange={e=>setEventName(e.target.value)} />
              <div className="helper">This is what will appear in GA4 (e.g., <code className="inline">scroll_depth_custom</code>).</div>
            </div>
          </div>

          <hr style={{border:'none', borderTop:'1px solid var(--border)', margin:'16px 0'}}/>

          <div className="kicker">Trigger (ScrollGenius Core)</div>
          <div className="grid grid-2" style={{gap:12, marginTop:12}}>
            <div>
              <div className="label">Scroll thresholds (%)</div>
              <input className="input" value={premium ? thresholds : defaultThresholds} onChange={e=>setThresholds(e.target.value)} disabled={!premium}/>
              <div className="helper">{premium ? "Comma separated list, e.g. 10,33,66,95" : "Premium unlock required for custom thresholds"}</div>
            </div>
            <div>
              <div className="label">Exclude elements (CSS selectors)</div>
              <textarea className="textarea" value={premium ? selectors : ""} onChange={e=>setSelectors(e.target.value)} disabled={!premium}/>
              <div className="helper">{premium ? "Example: #footer, .cookie, .banner, .sticky" : "Premium unlock required for clean data (footer/cookie/banner removal)"}</div>
            </div>
          </div>

          <div style={{display:'flex', gap:16, marginTop:10}}>
            <label className="toggle">
              <input type="checkbox" checked={spaFix} onChange={e=>setSpaFix(e.target.checked)} />
              <span className="pill"><span className="dot"/></span>
              <span>SPA / history change fix</span>
            </label>
            <label className="toggle">
              <input type="checkbox" checked={ajaxForms} onChange={e=>setAjaxForms(e.target.checked)} disabled={!premium}/>
              <span className="pill"><span className="dot"/></span>
              <span>FormGenius (AJAX listener)</span>
            </label>
          </div>

          <div style={{display:'flex', gap:10, marginTop:18}}>
            <button className="btn" onClick={handleGenerate} disabled={!canGenerate || busy}>
              {busy ? "Generating…" : "Generate GTM Container (JSON)"}
            </button>
            {!premium && (
              <button className="btn secondary" onClick={()=>setUnlockOpen(true)}>Unlock Premium</button>
            )}
          </div>

          {msg && <div className="small" style={{marginTop:10}}>{msg}</div>}
        </div>

        {/* Right: Explainer & diff */}
        <div className="card">
          <div className="kicker">Why Premium</div>
          <div className="h2">Stop tracking the footer.</div>
          <p className="small" style={{lineHeight:1.6}}>
            GA4’s basic scroll tracking (and most blog recipes) include your footer, cookie banners and sticky headers in the document height.  
            ScrollGenius generates a defensive listener that subtracts irrelevant elements and pushes clean thresholds to <code className="inline">dataLayer</code>.
          </p>

          <table className="table" style={{marginTop:10}}>
            <thead><tr><th>Feature</th><th>Free</th><th>Premium</th></tr></thead>
            <tbody>
              <tr><td>Data accuracy</td><td>Basic</td><td>100% (element exclusion)</td></tr>
              <tr><td>Thresholds</td><td>25,50,75,100</td><td>Custom (any %)</td></tr>
              <tr><td>SPA support</td><td>On</td><td>On</td></tr>
              <tr><td>AJAX form tracking</td><td>—</td><td>Included (optional)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Unlock modal */}
      {unlockOpen && (
        <div className="modal" onClick={()=>setUnlockOpen(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="h2">Unlock Premium (demo)</div>
            <p className="small">Enter <code className="inline">DEMO-PRO</code> to enable custom thresholds + element exclusion + AJAX forms.</p>
            <UnlockForm onUnlock={doUnlock}/>
          </div>
        </div>
      )}
    </main>
  );
}

function UnlockForm({ onUnlock }:{ onUnlock:(code:string)=>void }) {
  const [code, setCode] = useState("");
  return (
    <div style={{display:'flex', gap:8, marginTop:8}}>
      <input className="input" placeholder="Enter code…" value={code} onChange={e=>setCode(e.target.value)}/>
      <button className="btn" onClick={()=>onUnlock(code)}>Unlock</button>
    </div>
  );
}
