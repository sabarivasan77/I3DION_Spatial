import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(label, args, cwd) {
  const child = spawn(npmCommand, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
      process.exitCode = code;
    }
  });

  return child;
}

console.log('Starting I3DION Spatial dev stack...');
run('backend', ['run', 'dev'], path.join(root, 'backend'));
run('frontend', ['run', 'dev', '--', '--host', '127.0.0.1'], path.join(root, 'frontend'));
