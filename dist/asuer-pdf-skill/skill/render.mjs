#!/usr/bin/env node
// Asuer PDF renderer — zero npm dependencies.
// Drives Google Chrome (headless) over the DevTools Protocol using Node's
// built-in global fetch + WebSocket (Node >= 22). Produces an A4 PDF with a
// repeating Asuer footer (mark + document name + "n / N" page numbers).
//
// Usage:
//   node render.mjs <input.html> <output.pdf> [--footer "Doc name"]
//                    [--top MM] [--bottom MM] [--left MM] [--right MM]
//                    [--no-footer]
//
// The input HTML may also carry a config block that overrides the defaults:
//   <script type="application/json" id="pdf-config">
//     { "footer": "Privacy Policy", "margin": {"top":16,"bottom":18,"left":15,"right":15} }
//   </script>
//
// CLI flags win over the embedded config, which wins over the defaults below.

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, existsSync, readFileSync as rf } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  process.env.HOME + '/Library/Caches/ms-playwright/chromium-1134/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];
function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  for (const c of CHROME_CANDIDATES) if (existsSync(c)) return c;
  throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
}

// ---- args ----
const argv = process.argv.slice(2);
const positional = [];
const opt = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--no-footer') opt.noFooter = true;
  else if (a.startsWith('--')) { opt[a.slice(2)] = argv[++i]; }
  else positional.push(a);
}
const inputPath = resolve(positional[0] || '');
const outputPath = resolve(positional[1] || inputPath.replace(/\.html?$/i, '.pdf'));
if (!inputPath || !existsSync(inputPath)) { console.error('Input HTML not found:', inputPath); process.exit(1); }

// ---- config resolution: defaults < embedded < CLI ----
const html = readFileSync(inputPath, 'utf8');
let embedded = {};
const m = html.match(/<script[^>]*id=["']pdf-config["'][^>]*>([\s\S]*?)<\/script>/i);
if (m) { try { embedded = JSON.parse(m[1]); } catch (e) { console.error('bad pdf-config JSON:', e.message); } }

const marginDefault = { top: 16, bottom: 18, left: 15, right: 15 };
const margin = Object.assign(marginDefault, embedded.margin || {});
if (opt.top) margin.top = +opt.top;
if (opt.bottom) margin.bottom = +opt.bottom;
if (opt.left) margin.left = +opt.left;
if (opt.right) margin.right = +opt.right;

let footerText = opt.footer ?? embedded.footer ?? '';
if (!footerText) { const t = html.match(/<title>([\s\S]*?)<\/title>/i); if (t) footerText = t[1].replace(/\s*\|\s*Asuer.*$/i, '').trim(); }
const showFooter = !(opt.noFooter || embedded.footer === false);

const MM_PER_IN = 25.4;
const mm = (x) => x / MM_PER_IN;

// ---- footer mark (grey, cropped bird) as data URI ----
function footerMarkDataUri() {
  try {
    let svg = readFileSync(join(__dirname, 'assets', 'asuer-mark.svg'), 'utf8');
    svg = svg.replace(/#005d8b/gi, '#b6bbc4');                 // grey out
    svg = svg.replace(/viewBox="[^"]*"/, 'viewBox="163 33 116 105"'); // crop to bird
    return 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
  } catch { return ''; }
}

function footerTemplate() {
  if (!showFooter) return '<div></div>';
  const mark = footerMarkDataUri();
  const markImg = mark ? `<img src="${mark}" style="height:13px;width:auto;display:block;opacity:.9"/>` : '';
  const pad = margin.left; // align footer content to body edges
  return `
  <div style="width:100%;font-family:'Poppins','Helvetica Neue',Arial,sans-serif;font-size:8px;color:#9aa0a6;
              padding:0 ${pad}mm;box-sizing:border-box;-webkit-print-color-adjust:exact;">
    <div style="display:flex;align-items:center;justify-content:space-between;border-top:0;">
      <div style="flex:1;text-align:left;">${markImg}</div>
      <div style="flex:2;text-align:center;letter-spacing:.02em;">${escapeHtml(footerText)}</div>
      <div style="flex:1;text-align:right;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>
    </div>
  </div>`;
}
function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ---- CDP helpers ----
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function waitForPort(port, tries = 100) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return await r.json();
    } catch {}
    await sleep(100);
  }
  throw new Error('Chrome DevTools endpoint did not come up');
}

async function getPageWs(port) {
  const r = await fetch(`http://127.0.0.1:${port}/json`);
  const list = await r.json();
  const page = list.find(t => t.type === 'page') || list[0];
  if (!page || !page.webSocketDebuggerUrl) throw new Error('No page target');
  return page.webSocketDebuggerUrl;
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method && events.has(msg.method)) {
      events.get(msg.method)(msg.params);
    }
  });
  const ready = new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', (e) => rej(new Error('ws error')), { once: true });
  });
  return {
    ready,
    send(method, params = {}) {
      const mid = ++id;
      return new Promise((resolve, reject) => {
        pending.set(mid, { resolve, reject });
        ws.send(JSON.stringify({ id: mid, method, params }));
      });
    },
    once(method) { return new Promise(res => events.set(method, (p) => { events.delete(method); res(p); })); },
    close() { try { ws.close(); } catch {} },
  };
}

// ---- main ----
const chromePath = findChrome();
const userDataDir = mkdtempSync(join(tmpdir(), 'asuer-pdf-'));
const port = 0;

const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-background-networking', '--mute-audio',
  '--no-sandbox', '--disable-dev-shm-usage',   // required for headless Chrome in a cloud/container (e.g. Cowork)
  `--user-data-dir=${userDataDir}`, '--remote-debugging-port=0', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let stderr = '';
chrome.stderr.on('data', d => { stderr += d.toString(); });

async function readDevtoolsPort() {
  const portFile = join(userDataDir, 'DevToolsActivePort');
  for (let i = 0; i < 100; i++) {
    try { const txt = rf(portFile, 'utf8').trim(); const p = parseInt(txt.split('\n')[0], 10); if (p > 0) return p; } catch {}
    await sleep(100);
  }
  throw new Error('Chrome did not report a DevTools port');
}

try {
  const dbgPort = await readDevtoolsPort();
  await waitForPort(dbgPort);
  const wsUrl = await getPageWs(dbgPort);
  const client = cdp(wsUrl);
  await client.ready;

  // Resolve {{SKILL}} tokens to the skill dir's file:// URL, render a temp copy.
  const skillUrl = pathToFileURL(__dirname).href.replace(/\/$/, '');
  const resolvedHtml = html.replace(/\{\{SKILL\}\}/g, skillUrl);
  const tempHtml = join(userDataDir, 'doc.html');
  writeFileSync(tempHtml, resolvedHtml, 'utf8');

  await client.send('Page.enable');
  const loaded = client.once('Page.loadEventFired');
  await client.send('Page.navigate', { url: pathToFileURL(tempHtml).href });
  await Promise.race([loaded, sleep(15000)]);
  // let webfonts + layout settle
  try { await client.send('Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready ? document.fonts.ready.then(()=>1) : 1', awaitPromise: true }); } catch {}
  await sleep(400);

  const result = await client.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: false,
    paperWidth: 8.27, paperHeight: 11.69,          // A4
    marginTop: mm(margin.top), marginBottom: mm(margin.bottom),
    marginLeft: mm(margin.left), marginRight: mm(margin.right),
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: footerTemplate(),
  });
  writeFileSync(outputPath, Buffer.from(result.data, 'base64'));
  client.close();
  console.log('OK', outputPath);
} catch (e) {
  console.error('RENDER FAILED:', e.message);
  if (stderr) console.error(stderr.split('\n').slice(-8).join('\n'));
  process.exitCode = 1;
} finally {
  chrome.kill('SIGKILL');
}
