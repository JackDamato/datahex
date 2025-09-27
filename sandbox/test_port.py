#!/usr/bin/env python3
"""
Test different ports to find one that works
"""

import socket
import sys

def test_port(port):
    """Test if a port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def find_available_port():
    """Find an available port"""
    for port in range(3000, 9000):
        if test_port(port):
            print(f"Port {port} is available")
            return port
    return None

if __name__ == "__main__":
    port = find_available_port()
    if port:
        print(f"✅ Found available port: {port}")
    else:
        print("❌ No available ports found")
