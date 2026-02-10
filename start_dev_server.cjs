const fs = require('fs');
const { spawn } = require('child_process');

const cwd = 'C:/Users/deyan/Projects/Cuboid';
const out = fs.openSync(`${cwd}/dev-live.log`, 'a');
const err = fs.openSync(`${cwd}/dev-live.err.log`, 'a');

const child = spawn(
  'C:/Progra~1/nodejs/npm.cmd',
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4174'],
  {
    cwd,
    detached: true,
    shell: true,
    stdio: ['ignore', out, err],
  },
);

child.unref();
console.log(child.pid);
