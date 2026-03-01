const { useState, useEffect, useRef} = React;

// ── helpers ──────────────────────────────────────────────────────────────────
function sorted(arr) { return [...arr].sort((a, b) => a - b); }
function median(arr) {
  const s = sorted(arr);
  return s[Math.floor(s.length / 2)];
}
function totalCost(arr, m) {
  return arr.reduce((sum, x) => sum + Math.abs(x - m), 0);
}

const DEFAULT = [2, 4, 4, 7, 9];

// ── colour palette ─────────────────────────────────────────────────────────
const C = {
  bg: "#f5f0e8",
  card: "#fffdf7",
  border: "#e0d8c8",
  ink: "#1a1a2e",
  muted: "#7a7060",
  yellow: "#f5c800",
  yellowDark: "#c9a200",
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  purple: "#7c3aed",
  orange: "#ea580c",
};

// ── Stick visual ───────────────────────────────────────────────────────────
function StickBar({ value, max, target, index, isMedianTarget }) {
  const pct = (value / max) * 100;
  const tPct = (target / max) * 100;
  const diff = Math.abs(value - target);
  const shorter = value < target;

  return (
    <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 24, textAlign: "right", fontSize: 12, color: C.muted, fontFamily: "monospace" }}>
        x{index + 1}
      </div>
      <div style={{ flex: 1, position: "relative", height: 26 }}>
        {/* track */}
        <div style={{
          position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)",
          height: 4, background: "#e8e0d0", borderRadius: 2
        }} />
        {/* stick */}
        <div style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: `${pct}%`, height: 16, borderRadius: 8,
          background: isMedianTarget ? C.green : C.blue,
          transition: "width 0.3s ease",
          display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6
        }}>
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{value}</span>
        </div>
        {/* gap line */}
        {diff > 0 && (
          <div style={{
            position: "absolute",
            left: shorter ? `${pct}%` : `${tPct}%`,
            width: `${Math.abs(pct - tPct)}%`,
            top: "50%", transform: "translateY(-50%)",
            height: 4, borderRadius: 2,
            background: shorter ? C.red + "99" : C.orange + "99",
            transition: "all 0.3s ease"
          }} />
        )}
        {/* target tick */}
        <div style={{
          position: "absolute", left: `${tPct}%`, top: 0, bottom: 0,
          width: 3, background: C.yellow, borderRadius: 2,
          transform: "translateX(-50%)", transition: "left 0.3s ease"
        }} />
      </div>
      <div style={{ width: 38, fontSize: 12, fontFamily: "monospace", textAlign: "right",
        color: diff === 0 ? C.green : C.muted }}>
        {diff === 0 ? "✓" : `±${diff}`}
      </div>
    </div>
  );
}

// ── Cost plot ──────────────────────────────────────────────────────────────
function CostPlot({ sticks, target }) {
  const ref = useRef(null);
  const max = Math.max(...sticks);

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);

    const pl = 40, pr = 16, pt = 16, pb = 32;
    const steps = [];
    for (let m = 0; m <= max + 1; m += 0.2)
      steps.push({ m, c: totalCost(sticks, m) });
    const maxC = Math.max(...steps.map(d => d.c));
    const med = median(sticks);

    const tx = m => pl + (m / (max + 1)) * (W - pl - pr);
    const ty = c => pt + (1 - c / (maxC * 1.15)) * (H - pt - pb);

    // shade median region
    ctx.fillStyle = C.green + "18";
    const medX = tx(med);
    ctx.fillRect(medX - 2, pt, 5, H - pt - pb);

    // horizontal grid
    [0, 0.5, 1].forEach(f => {
      const y = pt + f * (H - pt - pb);
      ctx.strokeStyle = "#e8e0d0";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pl, y); ctx.lineTo(W - pr, y); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = "10px monospace";
      ctx.fillText(Math.round(maxC * 1.15 * (1 - f)), 2, y + 3);
    });

    // cost curve
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    steps.forEach((d, i) => {
      if (i === 0) ctx.moveTo(tx(d.m), ty(d.c));
      else ctx.lineTo(tx(d.m), ty(d.c));
    });
    ctx.stroke();

    // median dot
    const medCost = totalCost(sticks, med);
    ctx.fillStyle = C.green;
    ctx.beginPath(); ctx.arc(tx(med), ty(medCost), 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(tx(med), ty(medCost), 3, 0, Math.PI * 2); ctx.fill();

    // current target dot
    if (target !== med) {
      ctx.fillStyle = C.yellow;
      ctx.strokeStyle = C.yellowDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx(target), ty(totalCost(sticks, target)), 6, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = "#c8c0b0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pl, pt); ctx.lineTo(pl, H - pb); ctx.lineTo(W - pr, H - pb);
    ctx.stroke();

    // x-axis ticks
    sticks.forEach(s => {
      const x = tx(s);
      ctx.fillStyle = C.muted;
      ctx.font = "10px monospace";
      ctx.fillText(s, x - 4, H - pb + 14);
      ctx.strokeStyle = "#c8c0b0";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, H - pb); ctx.lineTo(x, H - pb + 4); ctx.stroke();
    });

    ctx.fillStyle = C.green;
    ctx.font = "bold 11px monospace";
    ctx.fillText("← median = " + med, tx(med) + 10, ty(medCost) - 8);

  }, [sticks, target]);

  return (
    <canvas ref={ref} width={520} height={160}
      style={{ width: "100%", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card }} />
  );
}

// ── Steps ──────────────────────────────────────────────────────────────────
const STEPS = [
  {
    emoji: "🤔",
    title: "What's the problem?",
    simple: "You have a bunch of sticks of different lengths. You want them ALL the same length. Each unit you add or cut costs 1. What target length is cheapest?",
    formal: "Given numbers x₁, x₂, …, xₙ, find the value m that makes  Σ|xᵢ − m|  as small as possible.",
    example: "Sticks: [2, 4, 4, 7, 9]\nIf we pick m = 6 → cost = 4+2+2+1+3 = 12\nIf we pick m = 4 → cost = 2+0+0+3+5 = 10  ← better!",
  },
  {
    emoji: "🎯",
    title: "Key idea: try moving m",
    simple: "Imagine sliding the target value left and right. When you move m one step right, every stick shorter than m gets 1 more expensive, and every stick longer than m gets 1 cheaper. The sweet spot is where these cancel out perfectly.",
    formal: "Moving m right by 1:\n• Sticks with xᵢ < m each cost +1 more  (there are L of them)\n• Sticks with xᵢ > m each cost −1 less  (there are R of them)\n• Net change = L − R\nCost decreases while R > L, increases when L > R.",
    example: "Move m from 3 → 4:\nL (sticks below 3) = 1  →  cost goes up by 1\nR (sticks above 3) = 3  →  cost goes down by 3\nNet = −2  ✓ worth moving right!",
  },
  {
    emoji: "⚖️",
    title: "The balance point = Median",
    simple: "Keep moving m right while more sticks are above than below. Stop when equal numbers are on each side. That balanced point is the MEDIAN — the middle value when sorted!",
    formal: "The optimal m satisfies:\n  #{xᵢ < m}  ≤  n/2  ≤  #{xᵢ > m}\nThis is exactly the definition of the median.\nFor odd n: m = middle element (0-indexed: n/2)\nFor even n: any value between the two middle elements works.",
    example: "Sorted: [2, 4, 4, 7, 9]\nMiddle index = 5/2 = 2  →  median = 4\nLeft of 4: {2} = 1 stick\nRight of 4: {7, 9} = 2 sticks  → balanced ✓",
  },
  {
    emoji: "☕",
    title: "Java solution",
    simple: "Sort the array, grab the middle element, sum up the differences. Done in O(n log n)!",
    formal: "Arrays.sort() runs in O(n log n).\nThe single pass for the sum is O(n).\nTotal: O(n log n) — fast enough for n ≤ 2×10⁵.",
    example: `import java.util.*;
import java.io.*;

public class StickLengths {
  public static void main(String[] args)
      throws IOException {
    BufferedReader br = new BufferedReader(
        new InputStreamReader(System.in));
    int n = Integer.parseInt(br.readLine().trim());
    long[] a = Arrays.stream(
        br.readLine().trim().split(" "))
      .mapToLong(Long::parseLong).toArray();

    Arrays.sort(a);
    long median = a[n / 2];   // middle element

    long cost = 0;
    for (long x : a)
      cost += Math.abs(x - median);

    System.out.println(cost);
  }
}`,
  },
];

// ── Quiz ──────────────────────────────────────────────────────────────────
const QUIZ = [
  {
    q: "Sticks are [1, 3, 5, 7, 9]. What is the optimal target length?",
    opts: ["3", "5", "4.5", "6"],
    ans: 1,
    exp: "Sorted: [1,3,5,7,9]. Middle index = 2 → median = 5. Cost = 4+2+0+2+4 = 12."
  },
  {
    q: "Why do we use median and NOT the average (mean)?",
    opts: [
      "Mean is harder to compute",
      "Median minimises Σ|xᵢ−m|, mean minimises Σ(xᵢ−m)²",
      "They always give the same answer",
      "Median is always a whole number"
    ],
    ans: 1,
    exp: "Absolute differences → median. Squared differences → mean. Different norms, different optimal points!"
  },
  {
    q: "Array [10, 20, 30, 40]. What is the minimum total cost?",
    opts: ["40", "60", "30", "20"],
    ans: 0,
    exp: "Even n=4: median = a[2] = 30. Cost = 20+10+0+10 = 40. (a[1]=20 also works: 10+0+10+20=40 ✓)"
  },
];

const MedianVisualizer = () => {
  const [sticks, setSticks] = useState(DEFAULT);
  const [target, setTarget] = useState(median(DEFAULT));
  const [inputVal, setInputVal] = useState(DEFAULT.join(", "));
  const [activeStep, setActiveStep] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const med = median(sticks);
  const maxLen = Math.max(...sticks);
  const curCost = totalCost(sticks, target);
  const minCost = totalCost(sticks, med);
  const isOptimal = curCost === minCost;

  function handleInput(e) {
    setInputVal(e.target.value);
    const nums = e.target.value.split(/[\s,]+/).map(Number)
      .filter(x => Number.isFinite(x) && x > 0 && x <= 50);
    if (nums.length >= 2 && nums.length <= 8) {
      setSticks(nums);
      setTarget(median(nums));
    }
  }

  function pick(i) {
    if (chosen !== null) return;
    setChosen(i);
    if (i === QUIZ[quizIdx].ans) setScore(s => s + 1);
  }

  function nextQ() {
    if (quizIdx + 1 >= QUIZ.length) { setDone(true); return; }
    setQuizIdx(q => q + 1);
    setChosen(null);
  }

  const step = STEPS[activeStep];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Georgia', serif", paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .opt-btn { transition: background 0.15s, border-color 0.15s; cursor: pointer; }
        .opt-btn:hover { background: #f0e8d0 !important; }
        .step-tab { transition: all 0.15s; cursor: pointer; }
        .step-tab:hover { background: #f0e8d0 !important; }
        @keyframes pop { 0%{transform:scale(0.95);opacity:0} 100%{transform:scale(1);opacity:1} }
        .pop { animation: pop 0.25s ease forwards; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: C.ink, color: "#fff", padding: "28px 32px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{
              background: C.yellow, color: C.ink,
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              fontFamily: "DM Mono, monospace", letterSpacing: 1
            }}>CSES 1074</span>
            <span style={{ fontSize: 12, color: "#888", fontFamily: "DM Mono, monospace" }}>
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Fraunces', serif", fontSize: "clamp(28px,6vw,48px)",
            fontWeight: 900, lineHeight: 1.1, color: "#fff", marginBottom: 8
          }}>
            📏 Stick Lengths
          </h1>
          <p style={{ color: "#aaa", fontSize: 15, lineHeight: 1.6, maxWidth: 520 }}>
            Make all sticks the same length with minimum total cost.
            The magic answer? Always pick the <span style={{ color: C.yellow, fontWeight: 700 }}>median</span>.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Interactive explorer ── */}
        <div style={{
          marginTop: 28, background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 24
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: C.ink, marginBottom: 4 }}>
                🔢 Try it yourself
              </h2>
              <p style={{ fontSize: 13, color: C.muted }}>Drag the slider to change target m</p>
            </div>
            <div style={{
              display: "flex", gap: 16, alignItems: "center",
              background: C.bg, borderRadius: 8, padding: "8px 16px"
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono", marginBottom: 2 }}>median</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 700, color: C.green }}>{med}</div>
              </div>
              <div style={{ width: 1, height: 36, background: C.border }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono", marginBottom: 2 }}>cost at m={target}</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 700,
                  color: isOptimal ? C.green : C.red }}>
                  {curCost} {isOptimal ? "✓" : `(+${curCost - minCost})`}
                </div>
              </div>
            </div>
          </div>

          {/* sticks */}
          <div style={{ marginBottom: 16 }}>
            {sorted(sticks).map((s, i) => (
              <StickBar key={i} value={s} max={maxLen + 2}
                target={target} index={i} isMedianTarget={target === med} />
            ))}
          </div>

          {/* slider */}
          <div style={{ marginBottom: 6 }}>
            <input type="range" min={1} max={maxLen + 1} step={1} value={target}
              onChange={e => setTarget(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.yellowDark, height: 6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11,
              color: C.muted, fontFamily: "DM Mono", marginTop: 4 }}>
              <span>m = 1</span>
              <span style={{
                fontWeight: 700, fontSize: 13,
                color: isOptimal ? C.green : C.ink,
                background: isOptimal ? C.green + "18" : C.yellow + "40",
                padding: "2px 10px", borderRadius: 20
              }}>
                m = {target} {isOptimal ? "← optimal! ✓" : ""}
              </span>
              <span>m = {maxLen + 1}</span>
            </div>
          </div>

          {/* cost curve */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "DM Mono", marginBottom: 8, letterSpacing: 1 }}>
              TOTAL COST CURVE  — notice the V-shape bottoms out at the median
            </div>
            <CostPlot sticks={sticks} target={target} />
          </div>

          {/* custom input */}
          <div style={{
            marginTop: 16, display: "flex", gap: 10, alignItems: "center",
            padding: "10px 14px", background: C.bg, borderRadius: 8
          }}>
            <span style={{ fontSize: 13, color: C.muted, whiteSpace: "nowrap" }}>✏️ Your sticks (2–8 numbers, max 50):</span>
            <input value={inputVal} onChange={handleInput}
              style={{
                flex: 1, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px",
                fontFamily: "DM Mono, monospace", fontSize: 14, background: C.card,
                color: C.ink, outline: "none"
              }}
              placeholder="e.g. 3, 7, 1, 9" />
          </div>
        </div>

        {/* ── Step-by-step explanation ── */}
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: C.ink, marginBottom: 16 }}>
            💡 How to understand it
          </h2>

          {/* tab buttons */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 0 }}>
            {STEPS.map((s, i) => (
              <button key={i}
                className="step-tab"
                onClick={() => setActiveStep(i)}
                style={{
                  border: `2px solid ${activeStep === i ? C.ink : C.border}`,
                  background: activeStep === i ? C.ink : C.card,
                  color: activeStep === i ? "#fff" : C.muted,
                  borderRadius: "8px 8px 0 0", padding: "8px 14px",
                  fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer",
                  fontWeight: activeStep === i ? 700 : 400
                }}>
                {s.emoji} {s.title}
              </button>
            ))}
          </div>

          <div key={activeStep} className="pop" style={{
            background: C.card, border: `2px solid ${C.ink}`,
            borderRadius: "0 8px 8px 8px", padding: 24
          }}>
            {/* plain English */}
            <div style={{
              display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 16,
              padding: "12px 16px", background: "#fffbe6", borderRadius: 8,
              border: `1px solid ${C.yellow}`
            }}>
              <span style={{ fontSize: 18 }}>💬</span>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: C.ink, margin: 0 }}>
                {step.simple}
              </p>
            </div>

            {/* formal */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontFamily: "DM Mono", color: C.purple,
                letterSpacing: 1, marginBottom: 6 }}>THE MATH</div>
              <pre style={{
                fontFamily: "DM Mono, monospace", fontSize: 13, lineHeight: 1.8,
                color: C.purple, background: "#f5f0ff",
                border: `1px solid ${C.purple}30`,
                borderRadius: 8, padding: "12px 16px", margin: 0,
                overflowX: "auto", whiteSpace: "pre-wrap"
              }}>{step.formal}</pre>
            </div>

            {/* example / code */}
            <div>
              <div style={{ fontSize: 11, fontFamily: "DM Mono", color: C.blue,
                letterSpacing: 1, marginBottom: 6 }}>
                {activeStep === 3 ? "JAVA CODE" : "EXAMPLE"}
              </div>
              <pre style={{
                fontFamily: "DM Mono, monospace",
                fontSize: activeStep === 3 ? 12 : 13,
                lineHeight: 1.8,
                color: activeStep === 3 ? C.ink : C.blue,
                background: activeStep === 3 ? "#f0f4ff" : "#f0f6ff",
                border: `1px solid ${C.blue}30`,
                borderRadius: 8, padding: "12px 16px", margin: 0,
                overflowX: "auto", whiteSpace: "pre-wrap"
              }}>{step.example}</pre>
            </div>
          </div>
        </div>

        {/* ── Mean vs Median callout ── */}
        <div style={{
          marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16
        }}>
          {[
            { icon: "📏", label: "Absolute cost  |xᵢ − m|", answer: "MEDIAN", color: C.green,
              note: "Each unit of error counts equally → the balancing point (median) wins." },
            { icon: "📐", label: "Squared cost  (xᵢ − m)²", answer: "MEAN", color: C.blue,
              note: "Large errors are penalised more → the average (mean) wins." },
          ].map(item => (
            <div key={item.label} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: 18
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontFamily: "DM Mono", fontSize: 12, color: C.muted, marginBottom: 4 }}>
                Minimise
              </div>
              <div style={{ fontFamily: "DM Mono", fontSize: 14, color: C.ink, fontWeight: 600, marginBottom: 10 }}>
                Σ {item.label}
              </div>
              <div style={{
                display: "inline-block", background: item.color + "18",
                color: item.color, fontFamily: "DM Mono", fontWeight: 700,
                fontSize: 13, padding: "4px 12px", borderRadius: 20, marginBottom: 10
              }}>→ use the {item.answer}</div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>{item.note}</p>
            </div>
          ))}
        </div>

        {/* ── Mini quiz ── */}
        <div style={{
          marginTop: 28, background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 24
        }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: C.ink, marginBottom: 4 }}>
            🧠 Quick quiz
          </h2>
          {!done ? (
            <>
              <div style={{ fontSize: 12, fontFamily: "DM Mono", color: C.muted, marginBottom: 16 }}>
                Question {quizIdx + 1} / {QUIZ.length}  •  Score: {score}
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.6, marginBottom: 16 }}>
                {QUIZ[quizIdx].q}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {QUIZ[quizIdx].opts.map((opt, i) => {
                  let bg = C.card, border = C.border, color = C.ink;
                  if (chosen !== null) {
                    if (i === QUIZ[quizIdx].ans) { bg = C.green + "20"; border = C.green; color = C.green; }
                    else if (i === chosen) { bg = C.red + "15"; border = C.red; color = C.red; }
                  }
                  return (
                    <button key={i} className="opt-btn" onClick={() => pick(i)}
                      style={{
                        background: bg, border: `2px solid ${border}`, color,
                        borderRadius: 8, padding: "10px 16px", textAlign: "left",
                        fontSize: 14, fontFamily: "Georgia, serif", cursor: "pointer"
                      }}>
                      <span style={{ fontFamily: "DM Mono", fontSize: 12, marginRight: 8 }}>
                        {["A", "B", "C", "D"][i]}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {chosen !== null && (
                <div className="pop" style={{
                  padding: "12px 16px", borderRadius: 8,
                  background: chosen === QUIZ[quizIdx].ans ? C.green + "15" : C.red + "10",
                  border: `1px solid ${chosen === QUIZ[quizIdx].ans ? C.green : C.red}`,
                  marginBottom: 12
                }}>
                  <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.6, margin: 0 }}>
                    {chosen === QUIZ[quizIdx].ans ? "✅ " : "❌ "}{QUIZ[quizIdx].exp}
                  </p>
                </div>
              )}
              {chosen !== null && (
                <button onClick={nextQ} style={{
                  background: C.ink, color: "#fff", border: "none",
                  borderRadius: 8, padding: "10px 24px", fontSize: 14,
                  fontFamily: "DM Mono", cursor: "pointer"
                }}>
                  {quizIdx + 1 >= QUIZ.length ? "See results →" : "Next question →"}
                </button>
              )}
            </>
          ) : (
            <div className="pop" style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {score === QUIZ.length ? "🏆" : score >= 2 ? "🎉" : "📚"}
              </div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
                {score} / {QUIZ.length}
              </div>
              <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
                {score === QUIZ.length
                  ? "Perfect! You've got the median intuition down!"
                  : score >= 2 ? "Nice work! Review the steps above to solidify your understanding."
                  : "Keep going — try reading through the steps again!"}
              </p>
              <button onClick={() => { setQuizIdx(0); setChosen(null); setScore(0); setDone(false); }}
                style={{
                  background: C.ink, color: "#fff", border: "none",
                  borderRadius: 8, padding: "10px 24px", fontSize: 14,
                  fontFamily: "DM Mono", cursor: "pointer"
                }}>
                Try again ↩
              </button>
            </div>
          )}
        </div>

        {/* ── Algorithm summary ── */}
        <div style={{
          marginTop: 28, background: C.ink, borderRadius: 12, padding: 24, color: "#fff"
        }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginBottom: 16, color: C.yellow }}>
            ☕ Algorithm at a glance
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 20 }}>
            {[
              { n: "Step 1", v: "Sort the array", c: C.yellow },
              { n: "Step 2", v: "Pick a[n/2]", c: "#4fc3f7" },
              { n: "Step 3", v: "Sum |xᵢ − median|", c: "#81c784" },
              { n: "Time", v: "O(n log n)", c: "#f48fb1" },
            ].map(item => (
              <div key={item.n} style={{
                background: "#ffffff12", borderRadius: 8, padding: "14px 16px"
              }}>
                <div style={{ fontSize: 11, fontFamily: "DM Mono", color: "#888", marginBottom: 4 }}>{item.n}</div>
                <div style={{ fontFamily: "DM Mono", fontSize: 14, color: item.c, fontWeight: 600 }}>{item.v}</div>
              </div>
            ))}
          </div>
          <pre style={{
            fontFamily: "DM Mono, monospace", fontSize: 13, lineHeight: 1.9,
            color: "#c8f0c0", background: "#0a0a14", borderRadius: 8,
            padding: "14px 18px", margin: 0, overflowX: "auto"
          }}>{`// Pseudocode (easy to remember!)
sort(array)
median = array[n / 2]
answer = sum of |array[i] - median|  for all i
print(answer)`}</pre>
        </div>

      </div>
    </div>
  );
}

// Mount to page
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<MedianVisualizer />);