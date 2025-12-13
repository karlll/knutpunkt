#!/usr/bin/env python3
"""
Terminal WebSocket Test Script (Python)

Simple Python script to test the terminal WebSocket API without
wrestling with bash escaping issues.

Usage:
    python3 test-terminal.py "pwd"
    python3 test-terminal.py "echo Hello World"
    python3 test-terminal.py "ls -la"

Install dependencies:
    pip3 install websocket-client
"""

import sys
import json
import time
import signal
from websocket import create_connection, WebSocketTimeoutException

# Configuration
WS_URL = "ws://localhost:8080/api/v1/terminal/session"
TIMEOUT_SECONDS = 5

def send_command(command):
    """Send a command to the terminal WebSocket API."""
    
    print(f"\n🔌 Connecting to {WS_URL}...")
    print(f"📝 Command: {command}\n")
    
    try:
        # Create WebSocket connection with timeout
        ws = create_connection(WS_URL, timeout=TIMEOUT_SECONDS)
        print("✅ Connected!\n")
        print("📤 Sending command...\n")
        
        # Send command with CR+LF
        message = {
            "type": "input",
            "data": command + "\r\n"
        }
        ws.send(json.dumps(message))
        
        # Receive and print output
        start_time = time.time()
        while True:
            # Check timeout
            if time.time() - start_time > TIMEOUT_SECONDS:
                print("\n⏱️  Timeout reached, closing connection...\n")
                break
            
            try:
                # Receive message with short timeout for responsiveness
                result = ws.recv()
                message = json.loads(result)
                
                if message["type"] == "output":
                    # Print output data (may contain ANSI codes)
                    print(message["data"], end="", flush=True)
                    
                elif message["type"] == "error":
                    print(f"\n❌ Error: {message['message']}\n", file=sys.stderr)
                    
                elif message["type"] == "exit":
                    print(f"\n🏁 Process exited with code: {message.get('code', 0)}\n")
                    break
                    
                else:
                    print(f"\n⚠️  Unknown message type: {message['type']}")
                    
            except WebSocketTimeoutException:
                # No message available, continue
                continue
            except json.JSONDecodeError as e:
                print(f"\n❌ Failed to parse message: {e}\n", file=sys.stderr)
                print(f"Raw data: {result}\n", file=sys.stderr)
                
        ws.close()
        print("\n🔌 Connection closed\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}\n", file=sys.stderr)
        sys.exit(1)

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully."""
    print("\n\n⚠️  Interrupted, exiting...\n")
    sys.exit(0)

if __name__ == "__main__":
    # Register Ctrl+C handler
    signal.signal(signal.SIGINT, signal_handler)
    
    # Get command from command line
    if len(sys.argv) < 2:
        command = "pwd"
        print("ℹ️  No command provided, using default: pwd")
    else:
        command = sys.argv[1]
    
    send_command(command)
