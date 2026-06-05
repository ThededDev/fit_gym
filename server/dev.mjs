import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const api = spawn(command, ['run', 'dev:api'], { stdio: 'inherit' });
const web = spawn(command, ['run', 'dev:web'], { stdio: 'inherit' });

function shutdown() {
  api.kill('SIGTERM');
  web.kill('SIGTERM');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
api.on('exit', (code) => {
  web.kill('SIGTERM');
  process.exit(code ?? 0);
});
web.on('exit', (code) => {
  api.kill('SIGTERM');
  process.exit(code ?? 0);
});
