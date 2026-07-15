/* POC deck: 4 slides, product-palette design (the dashboard's own colors).
   Slides 2 & 3 are the dense core; 1 & 4 are light bookends. */
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.title = "Work Management Dashboard — POC";

const INK = "25262B";
const DARK = "1F2430";
const MUTED = "676879";
const FAINT = "9699A6";
const BORDER = "E6E9EF";
const BLUE = "0073EA";
const BLUE_BG = "E0EDFF";
const BLUE_TXT = "1F5FAE";
const GREEN = "00C875";
const GREEN_BG = "DDF8EC";
const GREEN_TXT = "007A4D";
const ORANGE_BG = "FFF0DD";
const ORANGE_TXT = "B26B00";
const PURPLE_BG = "F3E8FC";
const PURPLE_TXT = "7E3EB6";
const GRAY_BG = "ECEDF5";
const GRAY_TXT = "50545E";
const CODE_BG = "2B2D36";

const HEAD = "Trebuchet MS";
const BODY = "Calibri";

const cardShadow = () => ({ type: "outer", color: "1E2761", blur: 7, offset: 2, angle: 135, opacity: 0.10 });

function card(slide, x, y, w, h) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.09,
    fill: { color: "FFFFFF" }, line: { color: BORDER, width: 1 },
    shadow: cardShadow(),
  });
}

function pill(slide, x, y, w, text, bg, fg, fontSize = 9) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h: 0.26, rectRadius: 0.12, fill: { color: bg }, line: { type: "none" },
  });
  slide.addText(text, {
    x, y: y - 0.012, w, h: 0.28, align: "center", valign: "middle",
    fontFace: BODY, fontSize, bold: true, color: fg, margin: 0,
  });
}

/* ---------------- Slide 1 — title ---------------- */
{
  const s = pres.addSlide();
  s.background = { color: DARK };

  s.addText("Work Management Dashboard", {
    x: 0.9, y: 2.1, w: 11.5, h: 0.9, fontFace: HEAD, fontSize: 44, bold: true,
    color: "FFFFFF", margin: 0,
  });
  s.addText(
    "One live view of every project and every person — with a built-in AI analyst that runs entirely on this machine.",
    { x: 0.9, y: 3.1, w: 10.6, h: 0.8, fontFace: BODY, fontSize: 18, color: "C9CDD8", margin: 0 }
  );

  const chips = [
    ["LIVE POC", BLUE],
    ["REAL JIRA DATA", GREEN],
    ["100% LOCAL AI", "A25DDC"],
  ];
  let cx = 0.9;
  for (const [t, c] of chips) {
    const w = 0.32 + t.length * 0.085;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: cx, y: 4.25, w, h: 0.38, rectRadius: 0.19, fill: { color: c }, line: { type: "none" },
    });
    s.addText(t, {
      x: cx, y: 4.235, w, h: 0.4, align: "center", valign: "middle",
      fontFace: BODY, fontSize: 11, bold: true, color: "FFFFFF", charSpacing: 1, margin: 0,
    });
    cx += w + 0.25;
  }

  s.addText("Proof of concept · built on the existing Jira ingestion pipeline", {
    x: 0.9, y: 6.7, w: 9, h: 0.4, fontFace: BODY, fontSize: 12, color: FAINT, margin: 0,
  });
}

/* ---------------- Slide 2 — the dashboard (core) ---------------- */
{
  const s = pres.addSlide();
  s.background = { color: "FFFFFF" };

  s.addText("Every project, every person, two clicks deep", {
    x: 0.7, y: 0.42, w: 11.9, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true, color: INK, margin: 0,
  });

  /* --- Card A: project pipeline --- */
  const ax = 0.7, ay = 1.25, aw = 5.95, ah = 3.3;
  card(s, ax, ay, aw, ah);
  s.addText("PROJECT PIPELINE", {
    x: ax + 0.25, y: ay + 0.18, w: 3.4, h: 0.3, fontFace: BODY, fontSize: 12, bold: true,
    color: BLUE, charSpacing: 1.5, margin: 0,
  });
  s.addText("one row per project, straight from the intake queue", {
    x: ax + 0.25, y: ay + 0.46, w: aw - 0.5, h: 0.28, fontFace: BODY, fontSize: 11, italic: true, color: MUTED, margin: 0,
  });

  // mini table mock
  const rows = [
    ["SD-184", "HR systems asset register", "In progress", ORANGE_BG, ORANGE_TXT, "A. Okafor"],
    ["SD-186", "Finance ops asset register", "Scoping", BLUE_BG, BLUE_TXT, "M. Chen"],
    ["SD-182", "Customer care SSO rollout", "Done", GREEN_BG, GREEN_TXT, "O. Haddad"],
  ];
  let ry = ay + 0.92;
  s.addText("KEY", { x: ax + 0.25, y: ry - 0.26, w: 0.9, h: 0.22, fontFace: BODY, fontSize: 8.5, bold: true, color: FAINT, charSpacing: 1, margin: 0 });
  s.addText("PROJECT", { x: ax + 1.15, y: ry - 0.26, w: 2.4, h: 0.22, fontFace: BODY, fontSize: 8.5, bold: true, color: FAINT, charSpacing: 1, margin: 0 });
  s.addText("STAGE", { x: ax + 3.7, y: ry - 0.26, w: 1.1, h: 0.22, fontFace: BODY, fontSize: 8.5, bold: true, color: FAINT, charSpacing: 1, margin: 0 });
  s.addText("OWNER", { x: ax + 4.85, y: ry - 0.26, w: 1.0, h: 0.22, fontFace: BODY, fontSize: 8.5, bold: true, color: FAINT, charSpacing: 1, margin: 0 });
  for (const [key, summary, stage, bg, fg, owner] of rows) {
    s.addShape(pres.shapes.LINE, { x: ax + 0.25, y: ry - 0.05, w: aw - 0.5, h: 0, line: { color: BORDER, width: 0.75 } });
    s.addText(key, { x: ax + 0.25, y: ry, w: 0.9, h: 0.3, fontFace: BODY, fontSize: 10.5, bold: true, color: INK, margin: 0, valign: "middle" });
    s.addText(summary, { x: ax + 1.15, y: ry, w: 2.5, h: 0.3, fontFace: BODY, fontSize: 10.5, color: GRAY_TXT, margin: 0, valign: "middle" });
    pill(s, ax + 3.7, ry + 0.02, 1.0, stage, bg, fg, 8.5);
    s.addText(owner, { x: ax + 4.85, y: ry, w: 1.0, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTED, margin: 0, valign: "middle" });
    ry += 0.44;
  }
  // KPI line
  s.addText([
    { text: "46", options: { bold: true, color: BLUE } }, { text: " projects   ·   ", options: { color: MUTED } },
    { text: "10", options: { bold: true, color: BLUE } }, { text: " clients   ·   ", options: { color: MUTED } },
    { text: "17", options: { bold: true, color: BLUE } }, { text: " in progress   ·   ", options: { color: MUTED } },
    { text: "live KPIs on top", options: { italic: true, color: FAINT } },
  ], { x: ax + 0.25, y: ay + ah - 0.52, w: aw - 0.5, h: 0.32, fontFace: BODY, fontSize: 11.5, margin: 0 });

  /* --- Card B: resource view --- */
  const bx = 6.95, by = 1.25, bw = 5.65, bh = 3.3;
  card(s, bx, by, bw, bh);
  s.addText("RESOURCE VIEW", {
    x: bx + 0.25, y: by + 0.18, w: 3.0, h: 0.3, fontFace: BODY, fontSize: 12, bold: true,
    color: BLUE, charSpacing: 1.5, margin: 0,
  });
  pill(s, bx + bw - 1.45, by + 0.18, 1.2, "‹  Sprint 25  ›", GRAY_BG, GRAY_TXT, 9);
  s.addText("one row per person per sprint — page through sprints", {
    x: bx + 0.25, y: by + 0.46, w: bw - 0.5, h: 0.28, fontFace: BODY, fontSize: 11, italic: true, color: MUTED, margin: 0,
  });

  const people = [
    ["Omar Haddad", 35, 1.0],
    ["Ravi Patel", 26, 0.74],
    ["Priya Nair", 22, 0.63],
    ["Maya Chen", 13, 0.37],
  ];
  let py = by + 0.95;
  const barMax = 2.6;
  for (const [name, pts, frac] of people) {
    s.addText(name, { x: bx + 0.25, y: py, w: 1.55, h: 0.3, fontFace: BODY, fontSize: 10.5, color: INK, margin: 0, valign: "middle" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx + 1.9, y: py + 0.07, w: barMax, h: 0.16, rectRadius: 0.08, fill: { color: "F1F2F6" }, line: { type: "none" } });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx + 1.9, y: py + 0.07, w: Math.max(barMax * frac, 0.16), h: 0.16, rectRadius: 0.08, fill: { color: BLUE }, line: { type: "none" } });
    s.addText(`${pts} open pts`, { x: bx + 4.6, y: py, w: 0.95, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTED, margin: 0, valign: "middle" });
    py += 0.42;
  }
  s.addText([
    { text: "Click any row to drill down ", options: { bold: true, color: INK } },
    { text: "— a project opens its linked issues; a person opens everything on their plate.", options: { color: MUTED } },
  ], { x: bx + 0.25, y: by + bh - 0.62, w: bw - 0.5, h: 0.45, fontFace: BODY, fontSize: 10.5, margin: 0 });

  /* --- feature strip --- */
  const feats = [
    ["▸", "Drill-down everywhere", "selection also feeds the AI assistant its context"],
    ["≡", "Fuzzy search + filters", "typo-tolerant search; filters build themselves from the data"],
    ["☰", "Schema-adaptive tables", "new columns in the data appear in the UI with zero code changes"],
    ["✓", "Freshness you can see", "every table shows which pipeline run produced it, and when"],
  ];
  let fx = 0.7;
  const fw = 2.92, fgap = 0.11;
  for (const [glyph, head, desc] of feats) {
    s.addShape(pres.shapes.OVAL, { x: fx, y: 4.95, w: 0.42, h: 0.42, fill: { color: BLUE_BG }, line: { type: "none" } });
    s.addText(glyph, { x: fx, y: 4.94, w: 0.42, h: 0.44, align: "center", valign: "middle", fontFace: BODY, fontSize: 15, bold: true, color: BLUE_TXT, margin: 0 });
    s.addText(head, { x: fx, y: 5.5, w: fw, h: 0.3, fontFace: BODY, fontSize: 12.5, bold: true, color: INK, margin: 0 });
    s.addText(desc, { x: fx, y: 5.8, w: fw, h: 0.85, fontFace: BODY, fontSize: 10.5, color: MUTED, margin: 0 });
    fx += fw + fgap;
  }
  s.addText("Pages are configuration, not code — adding a new view of a new table is one config entry.", {
    x: 0.7, y: 6.95, w: 11.9, h: 0.35, fontFace: BODY, fontSize: 11.5, italic: true, color: BLUE_TXT, margin: 0,
  });
}

/* ---------------- Slide 3 — data & AI (core) ---------------- */
{
  const s = pres.addSlide();
  s.background = { color: "FFFFFF" };

  s.addText("Local AI that shows its work", {
    x: 0.7, y: 0.42, w: 11.9, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true, color: INK, margin: 0,
  });

  /* --- left: data foundation flow --- */
  s.addText("DATA FOUNDATION", {
    x: 0.7, y: 1.25, w: 3.5, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: BLUE, charSpacing: 1.5, margin: 0,
  });
  const steps = [
    ["Jira REST API", "delivery board + service-desk intake queue"],
    ["Ingestion & transform pipeline", "raw snapshots, append-only history"],
    ["SQLite views  (BigQuery-ready)", "storage is one swappable module"],
    ["Dashboard + AI assistant", "both read the same governed tables"],
  ];
  let sy = 1.75;
  s.addShape(pres.shapes.LINE, { x: 0.93, y: sy + 0.22, w: 0, h: 3 * 1.02, line: { color: BORDER, width: 1.5 } });
  steps.forEach(([head, sub], i) => {
    s.addShape(pres.shapes.OVAL, { x: 0.7, y: sy, w: 0.46, h: 0.46, fill: { color: BLUE }, line: { type: "none" } });
    s.addText(String(i + 1), { x: 0.7, y: sy - 0.01, w: 0.46, h: 0.48, align: "center", valign: "middle", fontFace: BODY, fontSize: 14, bold: true, color: "FFFFFF", margin: 0 });
    s.addText(head, { x: 1.32, y: sy - 0.04, w: 3.5, h: 0.3, fontFace: BODY, fontSize: 13, bold: true, color: INK, margin: 0 });
    s.addText(sub, { x: 1.32, y: sy + 0.24, w: 3.5, h: 0.3, fontFace: BODY, fontSize: 10.5, color: MUTED, margin: 0 });
    sy += 1.02;
  });

  /* --- right: chat mock --- */
  const cx = 5.3, cy = 1.25, cw = 7.3, ch = 4.0;
  card(s, cx, cy, cw, ch);
  s.addText("THE ASSISTANT, IN ONE EXCHANGE", {
    x: cx + 0.3, y: cy + 0.18, w: 4.5, h: 0.28, fontFace: BODY, fontSize: 11, bold: true, color: BLUE, charSpacing: 1.5, margin: 0,
  });

  // user bubble
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx + 0.3, y: cy + 0.58, w: 4.3, h: 0.42, rectRadius: 0.1, fill: { color: "F1F2F6" }, line: { type: "none" } });
  s.addText("“Who has the most open points this sprint?”", {
    x: cx + 0.48, y: cy + 0.58, w: 4.1, h: 0.42, fontFace: BODY, fontSize: 12, color: INK, valign: "middle", margin: 0,
  });

  // sql block
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx + 0.62, y: cy + 1.2, w: 6.35, h: 0.78, rectRadius: 0.08, fill: { color: CODE_BG }, line: { type: "none" } });
  s.addText([
    { text: "SELECT assignee, open_points FROM assignee_sprint_current", options: { breakLine: true } },
    { text: "WHERE sprint = 'Sprint 25' ORDER BY open_points DESC LIMIT 3" },
  ], { x: cx + 0.85, y: cy + 1.26, w: 6.0, h: 0.66, fontFace: "Consolas", fontSize: 10.5, color: "9FE1CB", margin: 0 });
  pill(s, cx + 0.62, cy + 2.1, 2.5, "every query shown to the user", GRAY_BG, GRAY_TXT, 8.5);
  pill(s, cx + 3.24, cy + 2.1, 1.7, "read-only, by design", GRAY_BG, GRAY_TXT, 8.5);

  // answer bubble
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx + 0.62, y: cy + 2.56, w: 6.35, h: 0.5, rectRadius: 0.1, fill: { color: BLUE_BG }, line: { type: "none" } });
  s.addText([
    { text: "Omar Haddad", options: { bold: true } },
    { text: " has the most open points in Sprint 25 — ", options: {} },
    { text: "35 points", options: { bold: true } },
    { text: ".", options: {} },
  ], { x: cx + 0.85, y: cy + 2.56, w: 6.0, h: 0.5, fontFace: BODY, fontSize: 12, color: BLUE_TXT, valign: "middle", margin: 0 });
  pill(s, cx + 0.62, cy + 3.2, 3.1, "✓ every figure verified against the results", GREEN_BG, GREEN_TXT, 8.5);
  s.addText("context-aware: select a row and “this person” just works", {
    x: cx + 3.9, y: cy + 3.18, w: 3.2, h: 0.3, fontFace: BODY, fontSize: 9.5, italic: true, color: MUTED, margin: 0,
  });

  /* --- bottom stat strip --- */
  const stats = [
    ["100% local", "Ollama + open Gemma model — no API keys, no cloud, nothing leaves the laptop"],
    ["Read-only SQL", "single SELECT statements on a read-only connection — enforced by code, not by prompt"],
    ["Self-checking", "answers are auto-verified against query results; anything unverifiable is flagged on screen"],
  ];
  let stx = 0.7;
  const stw = 3.95, stgap = 0.13;
  for (const [big, small] of stats) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: stx, y: 5.55, w: stw, h: 1.45, rectRadius: 0.09, fill: { color: "F8F9FC" }, line: { color: BORDER, width: 1 } });
    s.addText(big, { x: stx + 0.22, y: 5.72, w: stw - 0.44, h: 0.4, fontFace: HEAD, fontSize: 19, bold: true, color: BLUE, margin: 0 });
    s.addText(small, { x: stx + 0.22, y: 6.14, w: stw - 0.44, h: 0.75, fontFace: BODY, fontSize: 10.5, color: MUTED, margin: 0 });
    stx += stw + stgap;
  }
}

/* ---------------- Slide 4 — closing ---------------- */
{
  const s = pres.addSlide();
  s.background = { color: DARK };

  s.addText("Where this goes next", {
    x: 0.9, y: 0.7, w: 11, h: 0.7, fontFace: HEAD, fontSize: 32, bold: true, color: "FFFFFF", margin: 0,
  });

  const cols = [
    ["Business rules", "Health flags, utilization thresholds, SLA logic — a ready plug-in slot, added without touching the UI"],
    ["Actions", "Assign work from the dashboard — the button is already in the interface, write-back is the next step"],
    ["Scale", "SQLite → BigQuery is designed in · Docker packaging built and tested · faster AI via a bigger model or a company endpoint"],
  ];
  let kx = 0.9;
  const kw = 3.75, kgap = 0.21;
  for (const [head, body] of cols) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: kx, y: 1.85, w: kw, h: 2.5, rectRadius: 0.1, fill: { color: "2A2F3D" }, line: { type: "none" } });
    s.addText(head, { x: kx + 0.28, y: 2.12, w: kw - 0.56, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color: "FFFFFF", margin: 0 });
    s.addText(body, { x: kx + 0.28, y: 2.6, w: kw - 0.56, h: 1.6, fontFace: BODY, fontSize: 12.5, color: "C9CDD8", margin: 0 });
    kx += kw + kgap;
  }

  s.addText([
    { text: "The ask:  ", options: { bold: true, color: "FFFFFF" } },
    { text: "which views and questions matter most to you? Adding them is configuration, not a project.", options: { color: "C9CDD8" } },
  ], { x: 0.9, y: 5.2, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 16, margin: 0 });

  s.addText("Working POC · real data · runs on a standard corporate laptop · Python only", {
    x: 0.9, y: 6.7, w: 11, h: 0.4, fontFace: BODY, fontSize: 12, color: "9699A6", margin: 0,
  });
}

pres.writeFile({ fileName: "dashboard_poc_deck.pptx" }).then(() => console.log("written"));
