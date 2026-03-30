export const runtime = 'edge';

// Root route: serve the briefing dashboard HTML
// Inlined from public/index.html to avoid CF Pages self-fetch issues
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rel — Morning Briefing</title>
  <style>
    :root {
      --bg: #0d0d0d;
      --surface: #161616;
      --border: #2a2a2a;
      --accent: #7c3aed;
      --accent-dim: #4c1d95;
      --text: #e4e4e7;
      --text-muted: #71717a;
      --green: #22c55e;
      --yellow: #eab308;
      --red: #ef4444;
      --blue: #3b82f6;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }

    /* Header */
    .header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      background: var(--bg);
      z-index: 100;
    }
    .header-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .logo { font-size: 18px; font-weight: 700; color: var(--accent); letter-spacing: -0.5px; }
    .date-badge {
      font-size: 13px;
      color: var(--text-muted);
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 3px 10px;
      border-radius: 20px;
    }
    .sprint-badge {
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 20px;
      background: var(--accent-dim);
      color: #c4b5fd;
      border: 1px solid var(--accent);
    }

    /* Tab Nav */
    .tab-nav {
      display: flex;
      gap: 0;
      padding: 0 24px;
      border-bottom: 1px solid var(--border);
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tab-nav::-webkit-scrollbar { display: none; }
    .tab-btn {
      padding: 14px 18px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    /* Main content */
    .content { max-width: 900px; margin: 0 auto; padding: 28px 24px; }

    /* Panels */
    .panel { display: none; }
    .panel.active { display: block; }

    /* Cards */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 14px;
    }

    /* Status pills */
    .pill {
      display: inline-block;
      font-size: 11px;
      padding: 2px 9px;
      border-radius: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .pill-green { background: #14532d; color: #86efac; }
    .pill-yellow { background: #713f12; color: #fde68a; }
    .pill-red { background: #7f1d1d; color: #fca5a5; }
    .pill-blue { background: #1e3a5f; color: #93c5fd; }
    .pill-purple { background: var(--accent-dim); color: #c4b5fd; }
    .pill-gray { background: #27272a; color: #a1a1aa; }

    /* Sprint summary (Tab 1) */
    .sprint-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: #1a1a1a;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-number { font-size: 32px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
    .stat-label { font-size: 12px; color: var(--text-muted); }
    .stat-green { color: var(--green); }
    .stat-yellow { color: var(--yellow); }
    .stat-red { color: var(--red); }
    .stat-blue { color: var(--blue); }

    /* Task list */
    .task-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
    }
    .task-row:last-child { border-bottom: none; }
    .task-id {
      font-family: 'SF Mono', monospace;
      font-size: 11px;
      color: var(--accent);
      background: var(--accent-dim);
      padding: 2px 7px;
      border-radius: 4px;
      white-space: nowrap;
      margin-top: 2px;
    }
    .task-body { flex: 1; min-width: 0; }
    .task-title { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
    .task-meta { font-size: 12px; color: var(--text-muted); line-height: 1.6; }
    .task-result {
      font-size: 13px;
      color: #a3e635;
      margin-top: 6px;
      padding: 8px 10px;
      background: #1a2e05;
      border-left: 2px solid #65a30d;
      border-radius: 0 4px 4px 0;
    }

    /* ── INLINE CONTENT VIEWER (RSH-186) ───────────────────────────── */
    .content-preview-toggle {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 8px;
      font-size: 12px;
      color: var(--accent);
      cursor: pointer;
      padding: 3px 8px;
      border: 1px solid var(--accent-dim);
      border-radius: 4px;
      background: none;
      user-select: none;
      transition: background 0.15s;
    }
    .content-preview-toggle:hover { background: var(--accent-dim); }
    .content-preview-toggle .arrow { transition: transform 0.2s; font-size: 10px; }
    .content-preview-toggle.open .arrow { transform: rotate(180deg); }

    .inline-content {
      display: none;
      margin-top: 10px;
      background: #0a0a0a;
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }
    .inline-content.open { display: block; }
    .inline-content-header {
      padding: 8px 14px;
      background: #111;
      border-bottom: 1px solid var(--border);
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .inline-content-body {
      padding: 14px 16px;
      font-size: 13px;
      line-height: 1.7;
      color: #ccc;
      max-height: 400px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'SF Mono', 'Consolas', monospace;
      scrollbar-width: thin;
      scrollbar-color: #333 transparent;
    }
    .inline-content-body::-webkit-scrollbar { width: 6px; }
    .inline-content-body::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

    /* Rendered markdown styles inside inline preview */
    .md-preview { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .md-preview h1, .md-preview h2, .md-preview h3 {
      color: var(--text);
      margin: 12px 0 6px;
      line-height: 1.3;
    }
    .md-preview h1 { font-size: 16px; }
    .md-preview h2 { font-size: 14px; color: var(--accent); }
    .md-preview h3 { font-size: 13px; }
    .md-preview p { margin: 6px 0; }
    .md-preview code {
      background: #1a1a1a;
      border: 1px solid var(--border);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 11px;
    }
    .md-preview pre {
      background: #111;
      border: 1px solid var(--border);
      padding: 10px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 8px 0;
    }
    .md-preview pre code { background: none; border: none; padding: 0; }
    .md-preview ul, .md-preview ol { padding-left: 18px; margin: 6px 0; }
    .md-preview li { margin: 3px 0; }
    .md-preview a { color: var(--accent); text-decoration: none; }
    .md-preview a:hover { text-decoration: underline; }
    .md-preview blockquote {
      border-left: 3px solid var(--accent);
      padding-left: 12px;
      color: var(--text-muted);
      margin: 8px 0;
    }
    .md-preview table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
    .md-preview th, .md-preview td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; }
    .md-preview th { background: #1a1a1a; color: var(--text); }
    .md-preview strong { color: var(--text); }
    /* ──────────────────────────────────────────────────────────────── */

    /* ─── Revise/Defer/Done action buttons (RSH-187) ─── */
    .ticket-actions {
      display: flex;
      gap: 6px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .btn-action {
      font-size: 11px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 5px;
      border: 1px solid;
      cursor: pointer;
      transition: opacity 0.15s;
      background: transparent;
    }
    .btn-action:hover { opacity: 0.8; }
    .btn-revise { color: #fbbf24; border-color: #fbbf24; }
    .btn-revise:hover { background: #713f12; }
    .btn-defer  { color: #a1a1aa; border-color: #3f3f46; }
    .btn-defer:hover  { background: #27272a; }
    .btn-done   { color: #86efac; border-color: #22c55e; }
    .btn-done:hover   { background: #14532d; }
    .btn-action:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Revise modal */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 200;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .modal-backdrop.hidden { display: none; }
    .modal-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    }
    .modal-title {
      font-size: 15px; font-weight: 600;
      margin-bottom: 4px;
    }
    .modal-subtitle {
      font-size: 12px; color: var(--text-muted);
      margin-bottom: 14px;
    }
    .modal-textarea {
      width: 100%; min-height: 100px;
      background: var(--bg); color: var(--text);
      border: 1px solid var(--border); border-radius: 7px;
      padding: 10px 12px; font-size: 13px;
      resize: vertical; outline: none;
      font-family: inherit;
    }
    .modal-textarea:focus { border-color: var(--accent); }
    /* RSH-179: File attach row */
    .modal-attach-row {
      display: flex; align-items: center; gap: 10px;
      margin-top: 10px;
    }
    .modal-attach-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 6px; cursor: pointer;
      background: var(--bg); color: var(--text-muted);
      border: 1px solid var(--border); font-size: 12px;
      transition: color 0.15s, border-color 0.15s;
    }
    .modal-attach-btn:hover { color: var(--text); border-color: var(--text-muted); }
    .modal-attach-preview {
      display: flex; flex-wrap: wrap; gap: 6px;
      margin-top: 8px;
    }
    .modal-attach-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: #1e293b; border: 1px solid var(--border);
      border-radius: 4px; padding: 3px 8px; font-size: 11px; color: var(--text-muted);
    }
    .modal-attach-chip button {
      background: none; border: none; cursor: pointer;
      color: #f87171; font-size: 13px; line-height: 1; padding: 0;
    }
    .modal-attach-thumb {
      width: 40px; height: 40px; object-fit: cover;
      border-radius: 4px; border: 1px solid var(--border);
    }
    .modal-actions {
      display: flex; justify-content: flex-end; gap: 8px;
      margin-top: 14px; flex-wrap: wrap;
    }
    .modal-btn {
      padding: 8px 18px; border-radius: 6px;
      font-size: 13px; font-weight: 500; cursor: pointer;
      border: 1px solid var(--border);
    }
    .modal-btn-cancel { background: var(--bg); color: var(--text-muted); }
    .modal-btn-cancel:hover { color: var(--text); }
    .modal-btn-submit { background: var(--accent); color: #fff; border-color: var(--accent); }
    .modal-btn-submit:hover { opacity: 0.85; }
    .modal-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    /* RSH-179: Work on now button */
    .modal-btn-now {
      background: #15803d; color: #fff; border-color: #15803d;
    }
    .modal-btn-now:hover { background: #166534; }
    .modal-btn-now:disabled { opacity: 0.5; cursor: not-allowed; }
    .modal-status {
      font-size: 12px; text-align: right; margin-top: 6px;
      min-height: 18px;
    }
    .modal-status.ok { color: #86efac; }
    .modal-status.err { color: #fca5a5; }

    /* Output preview section in review cards */
    .output-preview {
      margin-top: 8px;
      padding: 10px 12px;
      background: #111827;
      border: 1px solid #1e3a5f;
      border-radius: 6px;
      font-size: 12px;
      color: #93c5fd;
      line-height: 1.6;
    }
    .output-preview-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #3b82f6;
      margin-bottom: 5px;
    }

    /* Review action callout */
    .review-action {
      margin-top: 8px;
      padding: 8px 12px;
      background: #1c1208;
      border: 1px solid #92400e;
      border-radius: 6px;
      font-size: 12px;
      color: #fde68a;
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }

    /* Traffic lights */
    .traffic-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    .traffic-box {
      background: #1a1a1a;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .traffic-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-green { background: var(--green); box-shadow: 0 0 8px #22c55e80; }
    .dot-yellow { background: var(--yellow); box-shadow: 0 0 8px #eab30880; }
    .dot-red { background: var(--red); box-shadow: 0 0 8px #ef444480; }
    .traffic-label { font-size: 13px; font-weight: 500; }
    .traffic-detail { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .traffic-url { font-size: 11px; color: var(--accent); margin-top: 3px; }

    /* Timeline */
    .timeline { position: relative; padding-left: 20px; }
    .timeline::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 8px;
      bottom: 8px;
      width: 1px;
      background: var(--border);
    }
    .timeline-item { position: relative; padding: 0 0 20px 20px; }
    .timeline-dot {
      position: absolute;
      left: -15px;
      top: 4px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid var(--bg);
    }
    .timeline-time { font-size: 11px; color: var(--text-muted); margin-bottom: 3px; font-family: monospace; }
    .timeline-title { font-size: 14px; font-weight: 500; }
    .timeline-desc { font-size: 13px; color: var(--text-muted); margin-top: 3px; }

    /* Deep dive */
    .deep-issue {
      background: #111;
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .deep-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
    }
    .deep-header:hover { background: #1a1a1a; }
    .deep-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .deep-body { padding: 16px 18px; display: none; }
    .deep-row { margin-bottom: 12px; }
    .deep-row-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .deep-row-value { font-size: 13px; line-height: 1.5; }
    .collapse-icon { font-size: 18px; color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; }
    .deep-issue.open .collapse-icon { transform: rotate(180deg); }
    .deep-issue.open .deep-body { display: block; }

    /* Action items */
    .action-list { list-style: none; }
    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
      font-size: 14px;
    }
    .action-item:last-child { border-bottom: none; }
    .action-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
    .action-url { font-size: 12px; color: var(--accent); display: block; margin-top: 2px; }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 48px 20px;
      color: var(--text-muted);
    }
    .empty-icon { font-size: 36px; margin-bottom: 12px; }
    .empty-title { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
    .empty-sub { font-size: 14px; }

    /* Loading placeholder */
    .skeleton {
      background: linear-gradient(90deg, var(--surface) 25%, #222 50%, var(--surface) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      height: 14px;
      margin-bottom: 8px;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    @media (max-width: 600px) {
      .content { padding: 16px; }
      .sprint-grid { grid-template-columns: repeat(2, 1fr); }
      .traffic-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<header class="header">
  <div class="header-left">
    <div class="logo">☁ REL</div>
    <div class="date-badge" id="dateBadge">Loading…</div>
    <div class="sprint-badge" id="sprintStatus">Sprint Active</div>
  </div>
  <button onclick="logout()" style="padding:5px 12px;background:none;border:1px solid #2a2a2a;border-radius:6px;color:#71717a;font-size:11px;cursor:pointer;" title="Lock briefing">🔒 Lock</button>
</header>

<nav class="tab-nav">
  <button class="tab-btn active" onclick="showTab('summary', this)">📊 Summary</button>
  <button class="tab-btn" onclick="showTab('deep', this)">🔬 Deep Dive</button>
  <button class="tab-btn" onclick="showTab('exec', this)">🚦 Exec Status</button>
  <button class="tab-btn" onclick="showTab('timeline', this)">📅 Timeline</button>
</nav>

<main class="content">

  <!-- TAB 1: Summary -->
  <div class="panel active" id="tab-summary">
    <div class="sprint-grid">
      <div class="stat-box"><div class="stat-number stat-green" id="statDone">–</div><div class="stat-label">Completed</div></div>
      <div class="stat-box"><div class="stat-number stat-yellow" id="statReview">–</div><div class="stat-label">In Review</div></div>
      <div class="stat-box"><div class="stat-number stat-red" id="statFailed">–</div><div class="stat-label">Failed</div></div>
      <div class="stat-box"><div class="stat-number stat-blue" id="statOpen">–</div><div class="stat-label">Still Open</div></div>
    </div>

    <div class="card">
      <div class="card-title">✅ Completed Tonight</div>
      <div id="completedList"><div class="skeleton"></div><div class="skeleton" style="width:75%"></div></div>
    </div>

    <div class="card">
      <div class="card-title">👀 In Review — Needs Ryan</div>
      <div id="reviewList"><div class="skeleton"></div><div class="skeleton" style="width:60%"></div></div>
    </div>

    <div class="card">
      <div class="card-title">📋 Carry Forward (Still Open)</div>
      <div id="openList"><div class="skeleton"></div><div class="skeleton" style="width:80%"></div></div>
    </div>

    <div class="card">
      <div class="card-title">⚡ Actions for Ryan Today</div>
      <ul class="action-list" id="actionList">
        <li class="action-item"><span class="action-icon">⏳</span><span>Loading action items…</span></li>
      </ul>
    </div>
  </div>

  <!-- TAB 2: Deep Dive -->
  <div class="panel" id="tab-deep">
    <div class="card" style="margin-bottom:20px;">
      <div class="card-title">Per-Issue Breakdown</div>
      <p style="font-size:13px; color:var(--text-muted);">Click any issue to expand context, approach, outcome, and deliverable content inline.</p>
    </div>
    <div id="deepList">
      <div class="skeleton" style="height:52px; border-radius:10px; margin-bottom:12px;"></div>
      <div class="skeleton" style="height:52px; border-radius:10px; margin-bottom:12px;"></div>
    </div>
  </div>

  <!-- TAB 3: Exec Status (traffic lights) -->
  <div class="panel" id="tab-exec">
    <div class="card" style="margin-bottom:20px;">
      <div class="card-title">System Health Overview</div>
      <div class="traffic-grid" id="trafficGrid">
        <div class="skeleton" style="height:60px; border-radius:8px;"></div>
        <div class="skeleton" style="height:60px; border-radius:8px;"></div>
        <div class="skeleton" style="height:60px; border-radius:8px;"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Client Health</div>
      <div id="clientHealth"><div class="skeleton"></div><div class="skeleton" style="width:65%"></div></div>
    </div>

    <div class="card">
      <div class="card-title">💰 Daily Cost Estimate</div>
      <div id="costSection"><div class="skeleton"></div><div class="skeleton" style="width:55%"></div></div>
    </div>
  </div>

  <!-- TAB 4: Timeline -->
  <div class="panel" id="tab-timeline">
    <div class="card">
      <div class="card-title">Overnight Activity — Hour by Hour</div>
      <div class="timeline" id="timelineContent">
        <div class="skeleton" style="height:50px; margin-bottom:16px;"></div>
        <div class="skeleton" style="height:50px; margin-bottom:16px; width:85%;"></div>
      </div>
    </div>
  </div>

</main>

<!-- RSH-187 + RSH-179: Revise/Defer modal with file attach + Work on Now -->
<div class="modal-backdrop hidden" id="reviseModal" onclick="closeModal(event)">
  <div class="modal-box" onclick="event.stopPropagation()">
    <div class="modal-title" id="modalTitle">Revise ticket</div>
    <div class="modal-subtitle" id="modalSubtitle">Add context or feedback — the ticket will be enriched and re-queued for tonight's sprint.</div>
    <textarea class="modal-textarea" id="modalTextarea" placeholder="What should change? Add context, correct the approach, clarify the goal…"></textarea>
    <!-- RSH-179: File/image attach -->
    <div class="modal-attach-row">
      <label class="modal-attach-btn" for="modalFileInput" title="Attach images or files">
        📎 Attach file or image
      </label>
      <input type="file" id="modalFileInput" style="display:none" multiple accept="image/*,.pdf,.txt,.md,.json,.csv" onchange="handleFileAttach(this)">
      <span style="font-size:11px;color:var(--text-muted);" id="attachHint">Images, PDFs, or text files</span>
    </div>
    <div class="modal-attach-preview" id="attachPreview"></div>
    <div class="modal-actions">
      <button class="modal-btn modal-btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="modal-btn modal-btn-now" id="modalWorkNowBtn" onclick="submitRevise('now')" title="Trigger agent to work on this ticket immediately">⚡ Work on now</button>
      <button class="modal-btn modal-btn-submit" id="modalSubmitBtn" onclick="submitRevise('queue')">Send to tonight's sprint →</button>
    </div>
    <div class="modal-status" id="modalStatus"></div>
  </div>
</div>

<script>
// ─── Minimal markdown renderer ──────────────────────────────────────────────
function renderMd(text) {
  if (!text) return '';
  let html = text
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold/italic
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/\`\`\`[\\w]*\\n?([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
    // Links
    .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border-color:var(--border);margin:12px 0;">')
    // Lists
    .replace(/^[\\*\\-] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\\/li>\\n?)+/g, s => '<ul>' + s + '</ul>')
    .replace(/^\\d+\\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newline)
    .replace(/\\n{2,}/g, '</p><p>')
    // Single newlines inside paragraphs
    .replace(/\\n(?!<)/g, '<br>');
  return '<p>' + html + '</p>';
}

// ─── Content toggle (RSH-186) ────────────────────────────────────────────────
function toggleContent(btn) {
  btn.classList.toggle('open');
  const preview = btn.nextElementSibling;
  preview.classList.toggle('open');
  btn.querySelector('.arrow').textContent = preview.classList.contains('open') ? '▲' : '▼';
}

// Build the inline content block for a task item
function buildContentBlock(item) {
  if (!item.output_content && !item.output_preview) return '';

  const content = item.output_content || item.output_preview || '';
  const label = item.output_type ? item.output_type.toUpperCase() : 'PREVIEW';
  const fileName = item.files && item.files[0] ? item.files[0].split('/').pop() : '';
  const isMarkdown = fileName.endsWith('.md') || fileName.endsWith('.mdx') || item.output_type === 'article' || item.output_type === 'spec' || item.output_type === 'research';

  const contentHtml = isMarkdown
    ? \`<div class="md-preview">\${renderMd(content)}</div>\`
    : \`<div>\${escHtml(content)}</div>\`;

  return \`
    <button class="content-preview-toggle" onclick="toggleContent(this)">
      📄 Read \${label} inline <span class="arrow">▼</span>
    </button>
    <div class="inline-content">
      <div class="inline-content-header">
        <span>\${escHtml(fileName || label)}</span>
        \${item.output_url ? \`<a href="\${escHtml(item.output_url)}" target="_blank" style="color:var(--accent);font-size:11px;">Open ↗</a>\` : ''}
      </div>
      <div class="inline-content-body">\${contentHtml}</div>
    </div>\`;
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Tab switching ───────────────────────────────────────────────────────────
function showTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
}

// ─── Deep dive accordion ─────────────────────────────────────────────────────
function toggleDeep(el) {
  el.closest('.deep-issue').classList.toggle('open');
}

// ─── Date header ─────────────────────────────────────────────────────────────
function updateHeader() {
  const now = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('dateBadge').textContent = now.toLocaleDateString('en-US', opts);
  const hour = now.getUTCHours();
  const active = hour >= 4 && hour < 12;
  const badge = document.getElementById('sprintStatus');
  badge.textContent = active ? '🟢 Sprint Active' : '✅ Sprint Complete';
  badge.style.background = active ? '#14532d' : '#1c1c1c';
  badge.style.color = active ? '#86efac' : '#a1a1aa';
  badge.style.borderColor = active ? '#22c55e' : '#3f3f46';
}
updateHeader();

// ─── Load sprint data ────────────────────────────────────────────────────────
async function loadData() {
  let data;
  try {
    const res = await fetch('./data.json?v=' + Date.now());
    if (!res.ok) throw new Error('no data');
    data = await res.json();
  } catch {
    data = getPlaceholderData();
  }
  render(data);
}

function pill(status) {
  const map = { done: 'pill-green', review: 'pill-blue', failed: 'pill-red', open: 'pill-gray', blocked: 'pill-yellow' };
  const label = { done: 'Done', review: 'In Review', failed: 'Failed', open: 'Open', blocked: 'Blocked' };
  return \`<span class="pill \${map[status] || 'pill-gray'}">\${label[status] || status}</span>\`;
}

function render(data) {
  // Stats
  document.getElementById('statDone').textContent = data.stats.done;
  document.getElementById('statReview').textContent = data.stats.review;
  document.getElementById('statFailed').textContent = data.stats.failed;
  document.getElementById('statOpen').textContent = data.stats.open;

  // Completed
  const done = document.getElementById('completedList');
  if (!data.completed || data.completed.length === 0) {
    done.innerHTML = '<div class="empty"><div class="empty-icon">✅</div><div class="empty-sub">No tasks completed this sprint — check In Review</div></div>';
  } else {
    done.innerHTML = data.completed.map(t => \`
      <div class="task-row">
        <div class="task-id">\${escHtml(t.id)}</div>
        <div class="task-body">
          <div class="task-title">\${escHtml(t.title)}</div>
          <div class="task-meta">
            \${t.duration ? \`⏱ \${escHtml(t.duration)}\` : ''}
            \${t.pr ? \` · <a href="\${escHtml(t.pr)}" target="_blank" style="color:var(--accent)">View PR ↗</a>\` : ''}
            \${t.linear_url ? \` · <a href="\${escHtml(t.linear_url)}" target="_blank" style="color:var(--text-muted)">Linear</a>\` : ''}
          </div>
          \${t.result ? \`<div class="task-result">\${escHtml(t.result)}</div>\` : ''}
          \${buildContentBlock(t)}
        </div>
        \${pill('done')}
      </div>\`).join('');
  }

  // Review
  const rev = document.getElementById('reviewList');
  if (!data.review || data.review.length === 0) {
    rev.innerHTML = '<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">Nothing pending review</div>';
  } else {
    rev.innerHTML = data.review.map(t => \`
      <div class="task-row" id="row-\${escHtml(t.id)}">
        <div class="task-id">\${escHtml(t.id)}</div>
        <div class="task-body">
          <div class="task-title">\${escHtml(t.title)}</div>
          <div class="task-meta">
            \${t.pr ? \`<a href="\${escHtml(t.pr)}" target="_blank" style="color:var(--accent)">View PR ↗</a>\` : ''}
            \${t.linear_url ? \` · <a href="\${escHtml(t.linear_url)}" target="_blank" style="color:var(--text-muted)">Linear</a>\` : ''}
          </div>
          \${t.result ? \`<div class="task-result">\${escHtml(t.result)}</div>\` : ''}
          \${t.review_action ? \`<div class="review-action">👉 \${escHtml(t.review_action)}</div>\` : ''}
          \${buildContentBlock(t)}
          \${t.linear_issue_id ? \`<div class="ticket-actions">
            <button class="btn-action btn-revise" onclick="openReviseModal('\${escHtml(t.linear_issue_id)}','\${escHtml(t.id)}','\${escHtml(t.title.replace(/'/g,"\\\\'")||'')}')">🔄 Revise</button>
            <button class="btn-action btn-defer"  onclick="quickAction('\${escHtml(t.linear_issue_id)}','\${escHtml(t.id)}','defer')">⏸ Defer</button>
            <button class="btn-action btn-done"   onclick="quickAction('\${escHtml(t.linear_issue_id)}','\${escHtml(t.id)}','done',\${t.pr_number||'null'},'\${escHtml(t.pr_repo||'')}')">✅ Done</button>
          </div>\` : ''}
        </div>
        \${pill('review')}
      </div>\`).join('');
  }

  // Open
  const open = document.getElementById('openList');
  if (!data.open || data.open.length === 0) {
    open.innerHTML = '<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">All caught up! 🎉</div>';
  } else {
    open.innerHTML = data.open.map(t => \`
      <div class="task-row" id="row-\${escHtml(t.id)}">
        <div class="task-id">\${escHtml(t.id)}</div>
        <div class="task-body">
          <div class="task-title">\${escHtml(t.title)}</div>
          \${t.blocker ? \`<div class="task-meta" style="color:#fbbf24;">⚠️ \${escHtml(t.blocker)}</div>\` : ''}
          \${t.ryan_action ? \`<div class="review-action">👉 \${escHtml(t.ryan_action)}</div>\` : ''}
          \${t.linear_url ? \`<div class="task-meta"><a href="\${escHtml(t.linear_url)}" target="_blank" style="color:var(--text-muted)">Linear ↗</a></div>\` : ''}
          \${t.linear_issue_id ? \`<div class="ticket-actions">
            <button class="btn-action btn-revise" onclick="openReviseModal('\${escHtml(t.linear_issue_id)}','\${escHtml(t.id)}','\${escHtml((t.title||'').replace(/'/g,"\\\\'")||'')}')">🔄 Revise</button>
            <button class="btn-action btn-defer"  onclick="quickAction('\${escHtml(t.linear_issue_id)}','\${escHtml(t.id)}','defer')">⏸ Defer</button>
          </div>\` : ''}
        </div>
        \${pill(t.blocker ? 'blocked' : 'open')}
      </div>\`).join('');
  }

  // Actions
  document.getElementById('actionList').innerHTML = (data.actions || []).map(a =>
    \`<li class="action-item">
      <span class="action-icon">\${a.icon}</span>
      <span>
        \${escHtml(a.text)}
        \${a.url ? \`<a href="\${escHtml(a.url)}" target="_blank" class="action-url">\${escHtml(a.url)}</a>\` : ''}
      </span>
    </li>\`
  ).join('') || '<li class="action-item"><span class="action-icon">✅</span><span>No actions needed — great night!</span></li>';

  // Deep dive — now includes inline content viewer
  const deepEl = document.getElementById('deepList');
  if (!data.deep || data.deep.length === 0) {
    deepEl.innerHTML = '<div class="empty"><div class="empty-icon">🔬</div><div class="empty-title">No detail available</div><div class="empty-sub">Sprint data.json will be populated at end of sprint</div></div>';
  } else {
    deepEl.innerHTML = data.deep.map(d => \`
      <div class="deep-issue">
        <div class="deep-header" onclick="toggleDeep(this)">
          <div class="deep-left">
            <div class="task-id">\${escHtml(d.id)}</div>
            <div style="font-size:14px;font-weight:500;">\${escHtml(d.title)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            \${pill(d.status)}
            <span class="collapse-icon">▾</span>
          </div>
        </div>
        <div class="deep-body">
          \${d.why_picked ? \`<div class="deep-row"><div class="deep-row-label">Why picked</div><div class="deep-row-value">\${escHtml(d.why_picked)}</div></div>\` : ''}
          \${d.council_input ? \`<div class="deep-row"><div class="deep-row-label">Advisory council input</div><div class="deep-row-value">\${escHtml(d.council_input)}</div></div>\` : ''}
          \${d.approach ? \`<div class="deep-row"><div class="deep-row-label">Approach taken</div><div class="deep-row-value">\${escHtml(d.approach)}</div></div>\` : ''}
          \${d.outcome ? \`<div class="deep-row"><div class="deep-row-label">Outcome</div><div class="deep-row-value">\${escHtml(d.outcome)}</div></div>\` : ''}
          \${d.files_changed && d.files_changed.length ? \`<div class="deep-row"><div class="deep-row-label">Files changed</div><div class="deep-row-value" style="font-family:monospace;font-size:12px;">\${d.files_changed.map(f => escHtml(f)).join('<br>')}</div></div>\` : ''}
          \${d.pr ? \`<div class="deep-row"><div class="deep-row-label">PR</div><div class="deep-row-value"><a href="\${escHtml(d.pr)}" target="_blank" style="color:var(--accent)">\${escHtml(d.pr)}</a></div></div>\` : ''}
          \${d.followup ? \`<div class="deep-row"><div class="deep-row-label">Follow-up needed</div><div class="deep-row-value" style="color:#fbbf24;">\${escHtml(d.followup)}</div></div>\` : ''}
          \${d.output_content || d.output_preview ? buildContentBlock(d) : ''}
        </div>
      </div>\`).join('');
  }

  // Traffic lights
  document.getElementById('trafficGrid').innerHTML = (data.traffic || []).map(t => {
    const dot = { green: 'dot-green', yellow: 'dot-yellow', red: 'dot-red' }[t.status] || 'dot-yellow';
    return \`<div class="traffic-box">
      <div class="traffic-dot \${dot}"></div>
      <div>
        <div class="traffic-label">\${escHtml(t.label)}</div>
        <div class="traffic-detail">\${escHtml(t.detail)}</div>
        \${t.url ? \`<div class="traffic-url"><a href="\${escHtml(t.url)}" target="_blank">\${escHtml(t.url)}</a></div>\` : ''}
      </div>
    </div>\`;
  }).join('');

  // Client health
  document.getElementById('clientHealth').innerHTML = (data.clients || []).map(c => {
    const color = c.status === 'green' ? 'var(--green)' : c.status === 'yellow' ? 'var(--yellow)' : 'var(--red)';
    return \`<div style="padding:8px 0; border-bottom:1px solid var(--border); font-size:13px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
      <span><span style="color:\${color}; margin-right:8px;">●</span><strong>\${escHtml(c.name)}</strong></span>
      <span style="color:var(--text-muted); text-align:right;">\${escHtml(c.detail)}</span>
    </div>\`;
  }).join('') || '<div style="font-size:13px;color:var(--text-muted);">No client data</div>';

  // Costs
  const cost = data.costs || {};
  document.getElementById('costSection').innerHTML = \`
    <div style="font-size:13px; line-height:2;">
      <div>Workers: \${escHtml(cost.workers_requests || 'N/A')} requests / \${escHtml(cost.workers_cpu_ms || 'N/A')} CPU ms</div>
      <div>D1: \${escHtml(cost.d1_reads || 'N/A')} reads</div>
      <div style="margin-top:8px;font-weight:600;">Estimated: \${escHtml(cost.estimated_total || 'N/A')}</div>
      \${cost.note ? \`<div style="color:var(--text-muted);margin-top:6px;font-size:12px;">ℹ️ \${escHtml(cost.note)}</div>\` : ''}
    </div>\`;

  // Timeline
  document.getElementById('timelineContent').innerHTML = (data.timeline || []).map(e =>
    \`<div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-time">\${escHtml(e.time)}</div>
      <div class="timeline-title">\${escHtml(e.title)}</div>
      <div class="timeline-desc">\${escHtml(e.desc)}</div>
    </div>\`
  ).join('') || '<div class="empty"><div class="empty-icon">📅</div><div class="empty-sub">Timeline will populate during sprint</div></div>';
}

// ─── Placeholder data (RSH-186: shows output_content usage) ─────────────────
function getPlaceholderData() {
  return {
    generated_at: new Date().toISOString(),
    sprint_date: new Date().toLocaleDateString('en-US'),
    stats: { done: 0, review: 4, failed: 0, open: 7 },
    completed: [],
    review: [
      {
        id: 'RSH-186',
        title: 'Briefing Site: Show actual content inline',
        result: 'Added inline content viewer. Tasks can now include output_content field — click "Read inline" to view without leaving the page.',
        pr: 'https://github.com/RShuken/openclawinstall/pull/45',
        linear_url: 'https://linear.app/rsh/issue/RSH-186',
        linear_issue_id: 'f1c39528-8790-4ced-b66b-b91e0866c6e1',
        review_action: 'Merge PR #45 to dev, then trigger a new sprint to populate data.json with real output_content fields',
        output_type: 'spec',
        output_preview: 'RSH-186 adds an output_content field to the data.json schema. When a sprint task produces a document (article, spec, research), the full text is embedded in data.json. The briefing site renders it inline with a collapsible "Read inline" button — no GitHub required.',
        files: ['public/briefing/index.html']
      }
    ],
    open: [
      { id: 'RSH-188', title: 'CRM: Standalone app at crm.openclawinstall.net', priority: 'urgent', blocker: 'Architecture decision needed before CRM dashboard work can proceed', linear_url: 'https://linear.app/rsh/issue/RSH-188', linear_issue_id: 'b04b52b2-f242-421d-bbfb-9591070dbf30', ryan_action: 'Decide: same domain (/admin/crm) or separate app (crm.openclawinstall.net)?' },
      { id: 'RSH-181', title: 'Infra: Move skills + PRs out of openclawinstall', priority: 'urgent', blocker: null, linear_url: 'https://linear.app/rsh/issue/RSH-181', linear_issue_id: '1bc63ccb-8a36-4644-a67a-a028fb7f304e' }
    ],
    actions: [
      { icon: '🔑', text: 'Add ADMIN_PIN env var in CF Pages dashboard (Production) to activate PIN gate on /briefing/* and /admin/*', url: 'https://dash.cloudflare.com' },
      { icon: '🔀', text: 'Merge PR #44 (RSH-190) — PIN protection for admin/briefing routes', url: 'https://github.com/RShuken/openclawinstall/pull/44' },
      { icon: '🔀', text: 'Merge PR #19 (RSH-191) — Simple contact form for Denver AI Training (fixes zero conversions)', url: 'https://github.com/RShuken/denveraitraining/pull/19' },
      { icon: '🔀', text: 'Merge PR #3 (RSH-182) — Architecture wiki for openagent-connect', url: 'https://github.com/RShuken/openagent-connect/pull/3' }
    ],
    traffic: [
      { label: 'openclawinstall.net', status: 'green', detail: 'Site reachable', url: 'https://openclawinstall.net' },
      { label: 'leads-proxy API', status: 'green', detail: 'Worker responding' },
      { label: 'briefing.openclawinstall.net', status: 'yellow', detail: 'CF Pages custom domain pending (RSH-99)' },
      { label: 'ElevenLabs TTS', status: 'red', detail: 'API key not set in container' },
      { label: 'Linear Nightshift', status: 'green', detail: '18 open tickets tracked' }
    ],
    clients: [
      { name: 'Keenan Hock', status: 'green', detail: 'Enriched — linkedin.com/in/keenanhock, Studio Hock' },
      { name: 'Dan Corso', status: 'yellow', detail: 'Limited public info — enrichment deferred' }
    ],
    costs: {
      workers_requests: 'N/A',
      workers_cpu_ms: 'N/A',
      d1_reads: 'N/A',
      estimated_total: '~$0/day (in free tier)',
      note: 'CF_ANALYTICS_TOKEN not set — configure to enable cost reporting (RSH-98)'
    },
    timeline: [
      { time: '04:00 UTC', title: 'Sprint Kickoff', desc: 'Loaded context, queried Linear — 18 open Nightshift tickets' },
      { time: '04:10 UTC', title: 'RSH-186 started', desc: 'Building inline content viewer for briefing site' },
      { time: '05:00 UTC', title: 'RSH-186 complete', desc: 'PR #45 created — inline content viewer built and working' }
    ],
    deep: [
      {
        id: 'RSH-186',
        title: 'Briefing Site: Show actual content inline',
        status: 'review',
        why_picked: 'P1 Todo — highest priority unblocked ticket. Ryan has been seeing file paths and PR links but can\\'t read the actual output without clicking to GitHub.',
        approach: 'Added output_content field to data.json schema. Built a collapsible inline viewer with markdown rendering. Works for articles, specs, research — anything with text output.',
        outcome: 'PR #45 ready. The "Read inline" button now renders the full document inside the briefing card, with scrollable overflow and syntax-aware rendering.',
        followup: 'Update nightly-sprint task runner to populate output_content when tasks produce documents. Start with helpdesk articles and research writeups.',
        pr: 'https://github.com/RShuken/openclawinstall/pull/45',
        files_changed: ['public/briefing/index.html'],
        output_type: 'spec',
        output_content: '## RSH-186: Inline Content Viewer\\n\\nPreviously the briefing showed:\\n- "Files: \`content/helpdesk-articles/slack-rate-limit-fix.md\`"\\n- "PR: github.com/RShuken/openclawhelpdesk/pull/4"\\n\\nRyan had to click to GitHub, navigate to the file, and read it there.\\n\\n### What changed\\n\\nThe \`data.json\` schema now supports an \`output_content\` field on any task. When present, a "📄 Read inline" button appears below the result summary. Clicking it expands a rendered view of the full document — markdown headings, code blocks, links, tables.\\n\\n### Schema addition\\n\`\`\`json\\n{\\n  "output_content": "Full text of the document...",\\n  "output_type": "article | spec | research | script | pr | fix",\\n  "output_url": "https://live-url-if-deployed.com",\\n  "output_preview": "First 300 chars (used as fallback if output_content too large)"\\n}\\n\`\`\`\\n\\n### Next steps\\nUpdate the nightly sprint task runner to embed \`output_content\` for:\\n- Helpdesk articles (always)\\n- Research writeups (always)\\n- Specs and design docs (always)\\n- Code PRs (skip — GitHub is fine for code review)'
      }
    ]
  };
}

// ─── RSH-187 + RSH-179: Revise / Defer / Done / Work-on-Now flow ─────────────
let _modalIssueId = '';
let _modalTicketId = '';
let _attachedFiles = []; // RSH-179: file attachments

// RSH-179: Handle file input
function handleFileAttach(input) {
  const preview = document.getElementById('attachPreview');
  const files = Array.from(input.files || []);
  files.forEach(file => {
    if (_attachedFiles.find(f => f.name === file.name && f.size === file.size)) return; // dedup
    const entry = { name: file.name, size: file.size, type: file.type, file };
    _attachedFiles.push(entry);

    const chip = document.createElement('div');
    chip.className = 'modal-attach-chip';
    chip.id = 'chip-' + _attachedFiles.length;

    if (file.type.startsWith('image/')) {
      const thumb = document.createElement('img');
      thumb.className = 'modal-attach-thumb';
      const reader = new FileReader();
      reader.onload = e => { thumb.src = e.target.result; entry.dataUrl = e.target.result; };
      reader.readAsDataURL(file);
      chip.appendChild(thumb);
    } else {
      chip.appendChild(document.createTextNode('📄 '));
    }

    const label = document.createElement('span');
    label.textContent = file.name.length > 28 ? file.name.slice(0, 25) + '…' : file.name;
    chip.appendChild(label);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.title = 'Remove';
    const idx = _attachedFiles.length - 1;
    removeBtn.onclick = () => {
      _attachedFiles.splice(idx, 1, null); // nullify so indices don't shift
      chip.remove();
    };
    chip.appendChild(removeBtn);
    preview.appendChild(chip);
  });
  input.value = ''; // reset so same file can be re-added
}

function openReviseModal(linearIssueId, ticketId, title) {
  _modalIssueId = linearIssueId;
  _modalTicketId = ticketId;
  _attachedFiles = [];
  document.getElementById('attachPreview').innerHTML = '';
  document.getElementById('modalTitle').textContent = 'Revise: ' + ticketId;
  document.getElementById('modalSubtitle').textContent =
    '"' + title + '" — add context or feedback. The ticket will be enriched and re-queued for tonight.';
  document.getElementById('modalTextarea').value = '';
  document.getElementById('modalStatus').textContent = '';
  document.getElementById('modalStatus').className = 'modal-status';
  document.getElementById('modalSubmitBtn').disabled = false;
  document.getElementById('modalSubmitBtn').textContent = 'Send to tonight\\'s sprint →';
  document.getElementById('modalWorkNowBtn').disabled = false;
  document.getElementById('modalWorkNowBtn').textContent = '⚡ Work on now';
  document.getElementById('reviseModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('modalTextarea').focus(), 50);
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('reviseModal')) return;
  document.getElementById('reviseModal').classList.add('hidden');
}

// RSH-179: Build multipart payload (attachments as base64 in JSON)
async function buildRevisePayload(action) {
  const comment = document.getElementById('modalTextarea').value.trim();
  const attachments = [];

  for (const entry of _attachedFiles) {
    if (!entry) continue; // skip removed entries
    if (entry.dataUrl) {
      // image with pre-loaded dataUrl
      attachments.push({ name: entry.name, type: entry.type, data: entry.dataUrl });
    } else {
      // text/pdf: read as base64
      const data = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(entry.file);
      });
      attachments.push({ name: entry.name, type: entry.type, data });
    }
  }

  return {
    issue_id: _modalIssueId,
    user_comment: comment,
    action: action === 'now' ? 'trigger_now' : 'revise',
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}

async function submitRevise(mode = 'queue') {
  const comment = document.getElementById('modalTextarea').value.trim();
  if (!comment) {
    document.getElementById('modalStatus').textContent = 'Please add some feedback first.';
    document.getElementById('modalStatus').className = 'modal-status err';
    return;
  }

  const isNow = mode === 'now';
  const submitBtn = document.getElementById('modalSubmitBtn');
  const nowBtn = document.getElementById('modalWorkNowBtn');

  submitBtn.disabled = true;
  nowBtn.disabled = true;
  if (isNow) {
    nowBtn.textContent = 'Triggering…';
  } else {
    submitBtn.textContent = 'Enriching…';
  }
  document.getElementById('modalStatus').textContent = '';

  try {
    const payload = await buildRevisePayload(mode);
    const endpoint = isNow ? '/api/trigger-now' : '/api/revise';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      if (isNow) {
        document.getElementById('modalStatus').textContent = '⚡ Agent triggered — working on it now. Check Sprint topic in Telegram.';
        nowBtn.textContent = 'Triggered!';
      } else {
        document.getElementById('modalStatus').textContent = '✓ Queued for tonight — ticket enriched and marked reassessing.';
        submitBtn.textContent = 'Done!';
      }
      document.getElementById('modalStatus').className = 'modal-status ok';
      markRowFeedback(_modalTicketId, isNow ? 'working_now' : 'reassessing');
      setTimeout(() => document.getElementById('reviseModal').classList.add('hidden'), 2500);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (err) {
    document.getElementById('modalStatus').textContent = '✗ Error: ' + err.message;
    document.getElementById('modalStatus').className = 'modal-status err';
    submitBtn.disabled = false;
    nowBtn.disabled = false;
    submitBtn.textContent = 'Retry →';
    nowBtn.textContent = '⚡ Work on now';
  }
}

async function quickAction(linearIssueId, ticketId, action, prNumber, prRepo) {
  const row = document.getElementById('row-' + ticketId);
  const btns = row ? row.querySelectorAll('.btn-action') : [];
  btns.forEach(b => b.disabled = true);

  try {
    if (action === 'done') {
      // Step 1: close Linear ticket
      const revRes = await fetch('/api/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: linearIssueId, action: 'done' }),
      });
      const revData = await revRes.json();
      if (!revData.success) throw new Error(revData.error || 'Linear close failed');

      // Step 2: auto-merge associated PR into dev (if pr_number present)
      if (prNumber && prRepo) {
        const mergeRes = await fetch('/api/merge-pr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pr_number: prNumber, pr_repo: prRepo, ticket_id: ticketId }),
        });
        const mergeData = await mergeRes.json();
        if (!mergeData.success) {
          console.warn('[Done] PR merge failed (ticket still closed):', mergeData.error);
          markRowFeedback(ticketId, 'done_no_pr');
          return;
        }
        markRowFeedback(ticketId, 'merged');
      } else {
        markRowFeedback(ticketId, 'done');
      }
    } else {
      const res = await fetch('/api/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: linearIssueId, action }),
      });
      const data = await res.json();
      if (data.success) {
        markRowFeedback(ticketId, action);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    }
  } catch (err) {
    btns.forEach(b => b.disabled = false);
    alert('Error: ' + err.message);
  }
}

function markRowFeedback(ticketId, action) {
  const row = document.getElementById('row-' + ticketId);
  if (!row) return;
  const labels = {
    done: '✅ Marked done',
    done_no_pr: '✅ Done (no PR to merge)',
    merged: '✅ Done · PR merged to dev',
    defer: '⏸ Deferred',
    reassessing: '🔄 Re-queued for tonight',
    working_now: '⚡ Agent working now',
  };
  const colors = {
    done: 'var(--green)',
    done_no_pr: 'var(--green)',
    merged: 'var(--green)',
    defer: 'var(--text-muted)',
    reassessing: 'var(--yellow)',
    working_now: '#86efac',
  };
  const existing = row.querySelector('.ticket-actions');
  if (existing) {
    existing.innerHTML = \`<span style="font-size:12px;color:\${colors[action]||'var(--accent)'};">\${labels[action]||action}</span>\`;
  }
}

loadData();
</script>

<!-- Server-side PIN auth via middleware (RSH-190) — no client-side gate needed -->
<script>
window.logout = function() {
  document.cookie = 'briefing_session=; Path=/; Max-Age=0';
  window.location.href = '/login';
};
</script>
</body>
</html>
`;

export async function GET() {
  return new Response(HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
