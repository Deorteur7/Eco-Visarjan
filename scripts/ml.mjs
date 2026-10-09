// Cross-platform helper for the Python ML service.
//   node scripts/ml.mjs setup   create ml-service/.venv, install packages, train the model
//   node scripts/ml.mjs dev     start the service on http://127.0.0.1:8000
//   node scripts/ml.mjs test    run the Python tests
import { spawnSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mlDir = path.join(root, 'ml-service');
const venvDir = path.join(mlDir, '.venv');
const isWindows = process.platform === 'win32';
const venvPython = path.join(venvDir, isWindows ? 'Scripts' : 'bin', isWindows ? 'python.exe' : 'python');
const command = process.argv[2];

function findSystemPython() {
  const candidates = isWindows ? ['py', 'python', 'python3'] : ['python3', 'python'];
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (result.status === 0) return candidate;
  }
  return null;
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd: mlDir, ...options });
  if (result.status !== 0) {
    console.error(`\nCommand failed: ${cmd} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

function requireVenv() {
  if (!existsSync(venvPython)) {
    console.error('The ML environment is not set up yet. Run: npm run ml:setup');
    process.exit(1);
  }
}

if (command === 'setup') {
  const python = findSystemPython();
  if (!python) {
    console.error('Python 3.11+ was not found. Install it from https://www.python.org/downloads/ and retry.');
    process.exit(1);
  }
  if (!existsSync(venvPython)) run(python, ['-m', 'venv', '.venv']);
  const dev = process.argv.includes('--dev') ? 'requirements-dev.txt' : 'requirements.txt';
  run(venvPython, ['-m', 'pip', 'install', '--disable-pip-version-check', '--quiet', '-r', dev]);
  run(venvPython, ['train.py']);
  console.log('\nML service is ready. Start it with: npm run ml:dev');
} else if (command === 'dev') {
  requireVenv();
  const child = spawn(venvPython, ['-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', process.env.ML_PORT ?? '8000'], {
    stdio: 'inherit',
    cwd: mlDir,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
} else if (command === 'test') {
  requireVenv();
  run(venvPython, ['-m', 'pip', 'install', '--disable-pip-version-check', '--quiet', '-r', 'requirements-dev.txt']);
  run(venvPython, ['-m', 'pytest', '-q']);
} else {
  console.error('Usage: node scripts/ml.mjs <setup|dev|test>');
  process.exit(1);
}
