/**
 * GET /login — Serve PIN entry page
 * RSH-190 — Server-side PIN gate
 */

export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get('next') || '/';
  const error = url.searchParams.get('error');

  const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rel — Login</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0d0d0d;
      color: #e4e4e7;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
    }
    .logo { font-size: 32px; font-weight: 700; color: #7c3aed; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; color: #71717a; }
    form {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    input[type="password"] {
      width: 140px;
      padding: 14px;
      font-size: 24px;
      text-align: center;
      letter-spacing: 8px;
      background: #161616;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      color: #e4e4e7;
      outline: none;
      transition: border-color 0.15s;
    }
    input[type="password"]:focus { border-color: #7c3aed; }
    button {
      padding: 10px 32px;
      background: #7c3aed;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    button:hover { opacity: 0.85; }
    .error { color: #ef4444; font-size: 13px; min-height: 18px; }
  </style>
</head>
<body>
  <div class="logo">🔒 Rel — Briefing</div>
  <div class="subtitle">Enter your PIN to continue</div>
  <form method="POST" action="/api/auth">
    <input type="hidden" name="next" value="${escAttr(next)}" />
    <input type="password" name="pin" inputmode="numeric" maxlength="6" placeholder="••••" autofocus required />
    ${error ? '<div class="error">Incorrect PIN — try again</div>' : '<div class="error"></div>'}
    <button type="submit">Unlock</button>
  </form>
  <script>
    // Auto-submit when 4 digits entered
    const input = document.querySelector('input[type="password"]');
    input.addEventListener('input', function() {
      if (this.value.length >= 4) {
        this.form.submit();
      }
    });
  </script>
</body>
</html>`;

  return new Response(HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
