/**
 * Skill Point — Unified Dev Server Launcher
 * Starts both the Cloudflare Worker backend and the Vite frontend with one command.
 */

import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

const children = [];

function cleanup() {
  for (const child of children) {
    if (child && !child.killed) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', child.pid, '/f', '/t'], { stdio: 'ignore' });
        } else {
          child.kill('SIGTERM');
        }
      } catch {}
    }
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('exit', () => {
  cleanup();
});

async function main() {
  console.log('\n\x1b[38;2;234;88;12m%s\x1b[0m', '═══════════════════════════════════════════════════════');
  console.log('\x1b[38;2;234;88;12m%s\x1b[0m', '  SKILL POINT — FULL-STACK DEVELOPMENT ENVIRONMENT    ');
  console.log('\x1b[38;2;234;88;12m%s\x1b[0m', '═══════════════════════════════════════════════════════\n');

  // Check backend worker (port 8787)
  const workerRunning = await isPortOpen(8787);
  if (workerRunning) {
    console.log('\x1b[32m✔ [Backend]\x1b[0m Cloudflare Worker already running on http://127.0.0.1:8787');
  } else {
    console.log('\x1b[33m▶ [Backend]\x1b[0m Launching Cloudflare Worker (wrangler dev on port 8787)...');
    const workerCwd = path.join(__dirname, 'worker');
    const workerProc = spawn('npx', ['wrangler', 'dev', '--port', '8787'], {
      cwd: workerCwd,
      shell: true,
      stdio: 'pipe',
    });
    children.push(workerProc);

    workerProc.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('Ready on') || msg.includes('Starting local server')) {
        console.log('\x1b[32m✔ [Backend]\x1b[0m Worker ready on http://127.0.0.1:8787');
      }
    });

    workerProc.stderr.on('data', (d) => {
      const err = d.toString();
      if (err.includes('ERROR') || err.includes('failed')) {
        console.error('\x1b[31m[Backend Error]\x1b[0m', err.trim());
      }
    });
  }

  // Check frontend vite (port 5173)
  const viteRunning = await isPortOpen(5173);
  if (viteRunning) {
    console.log('\x1b[32m✔ [Frontend]\x1b[0m Vite server already running on http://localhost:5173');
    console.log('\n\x1b[36m🚀 Application is live at:\x1b[0m http://localhost:5173\n');
  } else {
    console.log('\x1b[33m▶ [Frontend]\x1b[0m Launching Vite dev server...');
    const viteProc = spawn('npx', ['vite'], {
      cwd: __dirname,
      shell: true,
      stdio: 'inherit',
    });
    children.push(viteProc);
  }
}

main().catch((err) => {
  console.error('[Launcher Error]', err);
  cleanup();
});
