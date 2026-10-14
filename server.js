const { spawn } = require('child_process');

console.log('[Runner] Starting Next.js and 24/7 Background Scheduler Worker...');

// Start background worker in same process thread
require('./worker.js');

// Start Next.js production server on Railway's assigned $PORT
const port = process.env.PORT || 3000;
const nextProcess = spawn('npx', ['next', 'start', '-p', port.toString()], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

nextProcess.on('close', (code) => {
  process.exit(code);
});
