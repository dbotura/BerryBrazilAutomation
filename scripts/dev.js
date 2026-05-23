import { spawn } from 'node:child_process';

const children = [
  runProcess('api', ['scripts/dev-api.js']),
  runProcess('ui', ['node_modules/vite/bin/vite.js']),
];

let isShuttingDown = false;

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0));
}

Promise.all(children.map(waitForExit)).then((codes) => {
  const failingCode = codes.find((code) => code !== 0);
  shutdown(failingCode ?? 0);
});

function runProcess(name, args) {
  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error(`${name} process failed to start:`, error);
  });

  return child;
}

function waitForExit(child) {
  return new Promise((resolve) => {
    child.on('exit', (code) => resolve(code ?? 0));
  });
}

function shutdown(code) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  process.exit(code);
}
