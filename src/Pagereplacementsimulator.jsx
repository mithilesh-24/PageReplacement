import { useState, useEffect, useRef } from "react";
import "./Pagereplacementsimulator.css";

const ALGO_ORDER = ["FIFO", "Optimal", "LRU"];

/* ─── Algorithms ───*/
function runFIFO(pages, fc) {
  const steps = [], frames = Array(fc).fill(null), queue = [];
  let faults = 0;
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i], hit = frames.includes(p);
    let evictedIdx = null, insertedAt = null, evictedPage = null;
    if (!hit) {
      faults++;
      if (frames.includes(null)) {
        insertedAt = frames.indexOf(null);
        frames[insertedAt] = p; queue.push(insertedAt);
      } else {
        evictedIdx = queue.shift(); evictedPage = frames[evictedIdx];
        frames[evictedIdx] = p; queue.push(evictedIdx); insertedAt = evictedIdx;
      }
    }
    steps.push({ page: p, frames: [...frames], fault: !hit, insertedAt, evictedIdx, evictedPage, faults });
  }
  return steps;
}
function runOptimal(pages, fc) {
  const steps = [], frames = Array(fc).fill(null);
  let faults = 0;
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i], hit = frames.includes(p);
    let evictedIdx = null, insertedAt = null, evictedPage = null;
    if (!hit) {
      faults++;
      if (frames.includes(null)) {
        insertedAt = frames.indexOf(null); frames[insertedAt] = p;
      } else {
        const fut = frames.map(f => { const nx = pages.slice(i + 1).indexOf(f); return nx === -1 ? Infinity : nx; });
        evictedIdx = fut.indexOf(Math.max(...fut)); evictedPage = frames[evictedIdx];
        frames[evictedIdx] = p; insertedAt = evictedIdx;
      }
    }
    steps.push({ page: p, frames: [...frames], fault: !hit, insertedAt, evictedIdx, evictedPage, faults });
  }
  return steps;
}
function runLRU(pages, fc) {
  const steps = [], frames = Array(fc).fill(null), rec = [];
  let faults = 0;
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i], idx = frames.indexOf(p);
    let evictedIdx = null, insertedAt = null, evictedPage = null;
    if (idx !== -1) { rec.splice(rec.indexOf(idx), 1); rec.push(idx); }
    else {
      faults++;
      if (frames.includes(null)) { insertedAt = frames.indexOf(null); frames[insertedAt] = p; rec.push(insertedAt); }
      else { evictedIdx = rec.shift(); evictedPage = frames[evictedIdx]; frames[evictedIdx] = p; rec.push(evictedIdx); insertedAt = evictedIdx; }
    }
    steps.push({ page: p, frames: [...frames], fault: idx === -1, insertedAt, evictedIdx, evictedPage, faults });
  }
  return steps;
}

const ALGO_CONFIG = {
  FIFO:    { color: "#3b4fd8", bg: "#eef0fc", desc: "First In, First Out — evict oldest page" },
  Optimal: { color: "#0d9488", bg: "#edfaf8", desc: "Optimal — evict page used furthest in future" },
  LRU:     { color: "#c2410c", bg: "#fff4ee", desc: "Least Recently Used — evict least recently accessed" },
};

/* ─── Animated frame cell ─────────────────────────────────────────── */
function FrameCell({ value, anim }) {
  const [cls, setCls] = useState("fv-normal");
  const prev = useRef(null);

  useEffect(() => {
    if (anim === "insert") { setCls("fv-insert"); setTimeout(() => setCls("fv-normal"), 460); }
    else if (anim === "replace") { setCls("fv-replace"); setTimeout(() => setCls("fv-normal"), 510); }
    else if (anim === "hit") { setCls("fv-hit"); setTimeout(() => setCls("fv-normal"), 420); }
    else { setCls("fv-normal"); }
    prev.current = value;
  }, [anim, value]);

  if (value === null) return <div className="fcell-empty" />;
  return <div className={`fcell-value ${cls}`}>{value}</div>;
}

/* ─── Single algorithm simulation view ───────────────────────────── */
function AlgoSimulation({ algo, pages, frameCount, currentStep, simKey }) {
  const stepsRef = useRef([]);
  const [animMap, setAnimMap] = useState({});

  useEffect(() => {
    const fn = algo === "FIFO" ? runFIFO : algo === "Optimal" ? runOptimal : runLRU;
    stepsRef.current = fn(pages, frameCount);
    setAnimMap({});
  }, [algo, pages, frameCount, simKey]);

  useEffect(() => {
    if (currentStep < 0 || !stepsRef.current[currentStep]) return;
    const s = stepsRef.current[currentStep];
    if (!s.fault) {
      const hitIdx = s.frames.indexOf(s.page);
      if (hitIdx !== -1) setAnimMap({ [hitIdx]: "hit" });
    } else if (s.evictedIdx !== null) {
      setAnimMap({ [s.insertedAt]: "replace" });
    } else if (s.insertedAt !== null) {
      setAnimMap({ [s.insertedAt]: "insert" });
    }
    const t = setTimeout(() => setAnimMap({}), 520);
    return () => clearTimeout(t);
  }, [currentStep, frameCount]);

  const steps = stepsRef.current;
  const cfg = ALGO_CONFIG[algo];
  const lastStep = steps[currentStep];
  const faults = lastStep?.faults ?? 0;
  const hits = currentStep >= 0 ? currentStep + 1 - faults : 0;
  const hitRate = currentStep >= 0 ? Math.round((hits / (currentStep + 1)) * 100) : 0;
  const visSteps = currentStep >= 0 ? steps.slice(0, currentStep + 1) : [];

  return (
    <div className="algo-section">
      <div className="algo-header">
        <div className="algo-title">
          <div className="algo-dot" style={{ background: cfg.color }} />
          <div>
            <div className="algo-name" style={{ color: cfg.color }}>{algo}</div>
            <div className="algo-desc">{cfg.desc}</div>
          </div>
        </div>
        <div className="algo-stats">
          <span className="stat-pill stat-fault">✗ {faults} faults</span>
          <span className="stat-pill stat-hit">✓ {hits} hits</span>
          <span className="stat-pill stat-rate">{hitRate}% hit rate</span>
        </div>
      </div>

      <div className="sim-scroll-wrap">
        <div className="sim-table">

          {/* Page reference row */}
          <div className="page-row" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="row-label">PAGE</div>
            {visSteps.map((s, i) => {
              const isCur = i === currentStep;
              const isDone = i < currentStep;
              const cls = isCur ? "pc-active" : isDone ? "pc-done" : "pc-idle";
              const statusCls = s.fault ? "pc-fault" : "pc-hit";
              return (
                <div key={i} className={`page-cell ${cls}`}>
                  <div className={`page-cell-inner ${statusCls}`}>{s.page}</div>
                </div>
              );
            })}
          </div>

          {/* Frame rows */}
          <div className="frames-section">
            {Array(frameCount).fill(null).map((_, fi) => (
              <div key={fi} className="frame-row">
                <div className="row-label" style={{ fontSize: 10, color: "var(--muted)" }}>
                  F{fi + 1}
                </div>
                {visSteps.map((s, si) => (
                  <div key={si} className="frame-cell">
                    <FrameCell
                      value={s.frames[fi] !== undefined ? s.frames[fi] : null}
                      anim={si === currentStep ? (animMap[fi] || "none") : "none"}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Status row: hit / fault */}
          <div className="status-row" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="row-label" style={{ fontSize: 10, color: "var(--muted)" }}>STATUS</div>
            {visSteps.map((s, i) => (
              <div key={i} className="status-cell">
                {s.fault
                  ? <span style={{ fontSize: 13, color: "var(--fault-text)", fontWeight: 700, fontFamily: "var(--mono)" }}>✗</span>
                  : <span style={{ fontSize: 13, color: "var(--hit-text)", fontWeight: 700, fontFamily: "var(--mono)" }}>✓</span>
                }
              </div>
            ))}
          </div>

          {/* Cumulative fault count row */}
          <div className="fault-count-row" style={{ borderTop: "1px dotted #e8e7e3" }}>
            <div className="row-label" style={{ fontSize: 10, color: "var(--muted)" }}>∑ FAULTS</div>
            {visSteps.map((s, i) => (
              <div key={i} className={`fc-cell ${s.fault ? "fc-fault" : ""}`}>
                {s.faults}
              </div>
            ))}
          </div>

        </div>
      </div>

      {visSteps.length === 0 && (
        <div className="empty-state">Press Play or step forward to begin simulation</div>
      )}
    </div>
  );
}

/* ─── Bar chart for comparison ───────────────────────────────────── */
function CompareChart({ entry }) {
  const { pages, frameCount, results } = entry;
  const maxF = Math.max(...results.map(r => r.faults), 1);
  const sorted = [...results].sort((a, b) => a.faults - b.faults);
  const tied = sorted[0].faults === sorted[sorted.length - 1].faults;
  const best = sorted[0].algo, worst = sorted[sorted.length - 1].algo;

  return (
    <div className="chart-card">
      <div className="chart-title">Reference: [{pages.join(" ")}]</div>
      <div className="chart-sub">{frameCount} frames · {pages.length} references</div>
      <div className="chart-bars">
        {results.map(r => {
          const cfg = ALGO_CONFIG[r.algo];
          const barH = Math.max((r.faults / maxF) * 130, 10);
          const isBest = !tied && r.algo === best;
          const isWorst = !tied && r.algo === worst;
          return (
            <div key={r.algo} className="chart-bar-col">
              <span className="bar-val" style={{ color: cfg.color }}>{r.faults}</span>
              <div className="bar-body" style={{ height: barH, background: cfg.color, opacity: isWorst ? 0.4 : 1 }}>
                {isBest && <div className="bar-star">★</div>}
              </div>
              <span className="bar-algo" style={{ color: cfg.color }}>{r.algo}</span>
              <span className="bar-pct">{Math.round(((pages.length - r.faults) / pages.length) * 100)}% hit</span>
            </div>
          );
        })}
      </div>
      <div className="chart-result">
        {tied
          ? <span className="result-tag rt-mid">All tied at {sorted[0].faults} faults</span>
          : sorted.map((r, i) => (
            <span key={r.algo} className={`result-tag ${i === 0 ? "rt-best" : i === sorted.length - 1 ? "rt-worst" : "rt-mid"}`}>
              {i === 0 ? "★ BEST" : i === sorted.length - 1 ? "✗ WORST" : "· MID"} · {r.algo} · {r.faults} faults
            </span>
          ))
        }
      </div>
    </div>
  );
}

/* ─── Root App ────────────────────────────────────────────────────── */
export default function App() {
  const [pageString, setPageString] = useState("1 2 3 4 1 2 5 1 2 3 4 5");
  const [frameCount, setFrameCount] = useState(4);
  const [pages, setPages] = useState([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [totalSteps, setTotalSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(850);
  const [hasRun, setHasRun] = useState(false);
  const [tab, setTab] = useState("sim");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [simKey, setSimKey] = useState(0);
  const [activeAlgo, setActiveAlgo] = useState("FIFO");
  const [controlsLocked, setControlsLocked] = useState(false);
  const intervalRef = useRef(null);
  const stepRef = useRef(-1);
  const controlLockRef = useRef(false);

  function lockControls() {
    controlLockRef.current = true;
    setControlsLocked(true);
    setTimeout(() => {
      controlLockRef.current = false;
      setControlsLocked(false);
    }, 120);
  }

  const parsed = pageString.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 99);

  function launch() {
    if (parsed.length < 2) { setError("Enter at least 2 page numbers (0–99)."); return; }
    setError("");
    clearInterval(intervalRef.current);
    setPages(parsed);
    setTotalSteps(parsed.length);
    setCurrentStep(-1);
    stepRef.current = -1;
    setActiveAlgo(ALGO_ORDER[0]);
    setSimKey(k => k + 1);
    setHasRun(true);
    const fc = frameCount;
    const fifo = runFIFO(parsed, fc), opt = runOptimal(parsed, fc), lru = runLRU(parsed, fc);
    const entry = {
      pages: parsed, frameCount: fc,
      results: [
        { algo: "FIFO",    faults: fifo[fifo.length - 1]?.faults ?? 0 },
        { algo: "Optimal", faults: opt[opt.length - 1]?.faults ?? 0 },
        { algo: "LRU",     faults: lru[lru.length - 1]?.faults ?? 0 },
      ],
    };
    setHistory(prev => [entry, ...prev.filter(e => e.pages.join() !== parsed.join() || e.frameCount !== fc)].slice(0, 8));
    setTimeout(() => setPlaying(true), 100);
  }

  useEffect(() => {
    if (playing && hasRun) {
      intervalRef.current = setInterval(() => {
        stepRef.current += 1;
        if (stepRef.current >= totalSteps) {
          const currIdx = ALGO_ORDER.indexOf(activeAlgo);
          if (currIdx < ALGO_ORDER.length - 1) {
            stepRef.current = -1;
            setCurrentStep(-1);
            setActiveAlgo(ALGO_ORDER[currIdx + 1]);
            setSimKey(k => k + 1);
            return;
          }
          setPlaying(false);
          clearInterval(intervalRef.current);
          return;
        }
        setCurrentStep(stepRef.current);
      }, speed);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [playing, totalSteps, speed, hasRun, activeAlgo]);

  const activeAlgoSteps =
    activeAlgo === "FIFO"
      ? runFIFO(pages, frameCount)
      : activeAlgo === "Optimal"
      ? runOptimal(pages, frameCount)
      : runLRU(pages, frameCount);

  const activeAlgoIndex = ALGO_ORDER.indexOf(activeAlgo);
  const visibleAlgos = hasRun ? ALGO_ORDER.slice(0, activeAlgoIndex + 1) : [];
  const runComplete = hasRun && activeAlgo === "LRU" && currentStep >= totalSteps - 1;

  function handlePlay() {
    if (controlLockRef.current) return;
    if (!hasRun) { launch(); return; }
    if (playing) return;
    if (runComplete) {
      lockControls();
      setActiveAlgo(ALGO_ORDER[0]);
      setCurrentStep(-1);
      stepRef.current = -1;
      setSimKey(k => k + 1);
      setTimeout(() => setPlaying(true), 60);
      return;
    }
    lockControls();
    setPlaying(true);
  }

  function handlePause() {
    if (controlLockRef.current) return;
    if (!hasRun || !playing) return;
    lockControls();
    setPlaying(false);
  }

  function stepFwd() {
    if (!hasRun) return;
    setPlaying(false); clearInterval(intervalRef.current);
    if (stepRef.current < totalSteps - 1) {
      const n = Math.min(stepRef.current + 1, totalSteps - 1);
      stepRef.current = n;
      setCurrentStep(n);
      return;
    }
    const currIdx = ALGO_ORDER.indexOf(activeAlgo);
    if (currIdx < ALGO_ORDER.length - 1) {
      setActiveAlgo(ALGO_ORDER[currIdx + 1]);
      setCurrentStep(-1);
      stepRef.current = -1;
      setSimKey(k => k + 1);
    }
  }
  function stepBck() {
    if (!hasRun) return;
    setPlaying(false); clearInterval(intervalRef.current);
    if (stepRef.current > -1) {
      const n = Math.max(stepRef.current - 1, -1);
      stepRef.current = n;
      setCurrentStep(n);
      setSimKey(k => k + 1);
      return;
    }
    const currIdx = ALGO_ORDER.indexOf(activeAlgo);
    if (currIdx > 0) {
      setActiveAlgo(ALGO_ORDER[currIdx - 1]);
      const n = totalSteps - 1;
      stepRef.current = n;
      setCurrentStep(n);
      setSimKey(k => k + 1);
    }
  }

  return (
    <>
      <div className="app">

        <div className="header">
          <h1>Page Replacement Simulator</h1>
          <p>OS Memory Management — FIFO · LRU · Optimal</p>
        </div>

        {/* Controls */}
        <div className="control-panel">
          <div className="control-row">
            <div className="field-group field-wide">
              <label>Page Reference String</label>
              <input value={pageString} onChange={e => setPageString(e.target.value)} placeholder="e.g. 1 2 3 4 1 2 5 1 2 3 4 5" />
            </div>
            <div className="field-group field-narrow">
              <label>Frames</label>
              <input type="number" min={1} max={8} value={frameCount}
                onChange={e => setFrameCount(Math.max(1, Math.min(8, Number(e.target.value))))} />
            </div>
            <button className="btn-run" onClick={launch}>Run Simulation</button>
          </div>
          {error && <div className="error-msg">{error}</div>}

          {hasRun && (
            <div className="playback-row">
              <button className="btn-sm" onClick={stepBck} disabled={currentStep < 0 && activeAlgoIndex === 0}>← Prev</button>
              <button className="btn-play-main" onClick={handlePlay} disabled={playing || controlsLocked}>
                {runComplete ? "↺ Restart" : "▶ Play"}
              </button>
              <button className="btn-play-main" onClick={handlePause} disabled={!playing || controlsLocked}>⏸ Pause</button>
              <button className="btn-sm" onClick={stepFwd} disabled={runComplete}>Next →</button>
              <div className="speed-wrap">
                <span>Speed</span>
                <input type="range" min={150} max={1800} step={50} value={1950 - speed}
                  onChange={e => setSpeed(1950 - Number(e.target.value))}
                  style={{ width: 90, accentColor: "#1a1917" }} />
              </div>
              <span className="algo-chip">Now Running: {activeAlgo}</span>
              <span className="step-counter">{currentStep + 1} / {totalSteps}</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        {hasRun && (
          <div className="timeline-card">
            <div className="tl-label">Reference Timeline →</div>
            <div className="tl-track">
              {pages.map((p, i) => {
                let cls = "";
                if (i < currentStep) cls = "tl-done";
                else if (i === currentStep) cls = "tl-current";
                let statusCls = "";
                if (i <= currentStep && activeAlgoSteps[i]) {
                  statusCls = activeAlgoSteps[i].fault ? "tl-fault" : "tl-hit";
                }
                return (
                  <div key={i} className="tl-chip">
                    <div className={`tl-num ${cls} ${statusCls}`}>{p}</div>
                    <span className="tl-idx">{i}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${tab === "sim" ? "tab-active" : ""}`} onClick={() => setTab("sim")}>Simulation</button>
          <button className={`tab-btn ${tab === "charts" ? "tab-active" : ""}`} onClick={() => setTab("charts")}>Compare Charts</button>
        </div>

        {/* Simulation: one per algorithm */}
        {tab === "sim" && (
          <>
            {!hasRun
              ? <div className="empty-state">Enter a page reference string and press <strong>Run Simulation</strong></div>
              : visibleAlgos.map((algo) => {
                const isActive = algo === activeAlgo;
                const stepForAlgo = isActive ? currentStep : totalSteps - 1;
                return (
                  <AlgoSimulation
                    key={`${algo}-${simKey}`}
                    algo={algo}
                    pages={pages}
                    frameCount={frameCount}
                    currentStep={stepForAlgo}
                    simKey={simKey}
                  />
                );
              })
            }
            {hasRun && (
              <div className="legend">
                {[
                  { c: "#ca8a04", bc: "#a16207", l: "New insert / Replace" },
                  { c: "#dcfce7", bc: "#16a34a", l: "Hit (already in memory)" },
                  { c: "#f5f5f4", bc: "#d4d0c8", l: "Occupied frame" },
                ].map(({ c, bc, l }) => (
                  <div key={l} className="legend-item">
                    <div className="legend-dot" style={{ background: c, borderColor: bc }} />
                    {l}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Charts */}
        {tab === "charts" && (
          <div className="charts-wrap">
            {history.length === 0
              ? <div className="empty-state">Run simulations to see comparison charts</div>
              : history.map((entry, i) => <CompareChart key={i} entry={entry} />)
            }
          </div>
        )}

      </div>
    </>
  );
}