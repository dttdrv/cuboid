const { spawn } = require('child_process');

const node = process.execPath;
const npmCli = process.env.npm_execpath;

if (!npmCli) {
  console.error('[dev] npm_execpath is missing. Run via "npm run dev".');
  process.exit(1);
}

const children = new Set();
let shuttingDown = false;

const spawnNpmScript = (scriptName) => {
  const child = spawn(node, [npmCli, 'run', scriptName], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
  children.add(child);
  child.on('exit', () => {
    children.delete(child);
    if (!shuttingDown) {
      shuttingDown = true;
      shutdown(1);
    }
  });
  child.on('error', (error) => {
    console.error(`[dev] failed to start ${scriptName}:`, error);
    if (!shuttingDown) {
      shuttingDown = true;
      shutdown(1);
    }
  });
  return child;
};

const shutdown = (code = 0) => {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      // Ignore process termination errors during shutdown.
    }
  }
  process.exit(code);
};

process.on('SIGINT', () => {
  if (!shuttingDown) {
    shuttingDown = true;
    shutdown(0);
  }
});

process.on('SIGTERM', () => {
  if (!shuttingDown) {
    shuttingDown = true;
    shutdown(0);
  }
});

spawnNpmScript('dev:backend');
spawnNpmScript('dev:frontend');
