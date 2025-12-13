#!/usr/bin/env node
/**
 * Terminal WebSocket Test Script
 * 
 * Simple Node.js script to test the terminal WebSocket API without
 * wrestling with bash escaping issues.
 * 
 * Usage:
 *   node test-terminal.js "pwd"
 *   node test-terminal.js "echo Hello World"
 *   node test-terminal.js "ls -la"
 * 
 * Install dependencies:
 *   npm install ws
 */

const WebSocket = require('ws');

// Configuration
const WS_URL = 'ws://localhost:8080/api/v1/terminal/session';
const TIMEOUT_MS = 5000;

// Get command from command line
const command = process.argv[2] || 'pwd';

console.log(`\n🔌 Connecting to ${WS_URL}...`);
console.log(`📝 Command: ${command}\n`);

// Create WebSocket connection
const ws = new WebSocket(WS_URL);

// Track if we've sent the command
let commandSent = false;

// Timeout to close connection
const timeout = setTimeout(() => {
  console.log('\n⏱️  Timeout reached, closing connection...\n');
  ws.close();
}, TIMEOUT_MS);

ws.on('open', () => {
  console.log('✅ Connected!\n');
  console.log('📤 Sending command...\n');
  
  // Send command with CR+LF
  const message = {
    type: 'input',
    data: command + '\r\n'
  };
  
  ws.send(JSON.stringify(message));
  commandSent = true;
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    switch (message.type) {
      case 'output':
        // Print output data (may contain ANSI codes)
        process.stdout.write(message.data);
        break;
        
      case 'error':
        console.error(`\n❌ Error: ${message.message}\n`);
        break;
        
      case 'exit':
        console.log(`\n🏁 Process exited with code: ${message.code}\n`);
        ws.close();
        break;
        
      default:
        console.log(`\n⚠️  Unknown message type: ${message.type}`);
    }
  } catch (err) {
    console.error(`\n❌ Failed to parse message: ${err.message}`);
    console.error(`Raw data: ${data.toString()}\n`);
  }
});

ws.on('error', (err) => {
  console.error(`\n❌ WebSocket error: ${err.message}\n`);
  process.exit(1);
});

ws.on('close', () => {
  clearTimeout(timeout);
  console.log('\n🔌 Connection closed\n');
  process.exit(0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interrupted, closing connection...\n');
  ws.close();
});
