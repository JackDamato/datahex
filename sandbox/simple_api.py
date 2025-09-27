#!/usr/bin/env python3
"""
Simple HTTP API server for data science operations
Works around uvicorn issues by using built-in Python HTTP server
"""

import http.server
import socketserver
import json
import urllib.parse
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tools.cleaning import drop_nulls
from tools.stats import compute_summary_stats
from tools.plotgen import generate_plot
from tools.train import train_model

class DataScienceAPIHandler(http.server.BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        """Set CORS headers for browser compatibility"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def _send_json_response(self, data, status=200):
        """Send JSON response with CORS headers"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self._send_json_response({"status": "ok", "message": "Data Science API Server Running"})
        
        elif self.path == '/mcp/tools':
            tools = [
                {
                    "name": "drop_nulls",
                    "description": "Remove rows with null values from dataset",
                    "parameters": {
                        "dataset_path": {"type": "string", "description": "Path to dataset file"},
                        "columns": {"type": "array", "description": "Optional columns to check"}
                    }
                },
                {
                    "name": "summary_stats",
                    "description": "Compute summary statistics for a column",
                    "parameters": {
                        "dataset_path": {"type": "string", "description": "Path to dataset file"},
                        "column": {"type": "string", "description": "Column name to analyze"}
                    }
                },
                {
                    "name": "generate_plot",
                    "description": "Generate Plotly visualization",
                    "parameters": {
                        "dataset_path": {"type": "string", "description": "Path to dataset file"},
                        "type": {"type": "string", "description": "Plot type: histogram, scatter, heatmap"},
                        "columns": {"type": "array", "description": "Columns to plot"}
                    }
                },
                {
                    "name": "train_model",
                    "description": "Train a machine learning model",
                    "parameters": {
                        "dataset_path": {"type": "string", "description": "Path to dataset file"},
                        "features": {"type": "array", "description": "Feature columns"},
                        "target": {"type": "string", "description": "Target column"},
                        "type": {"type": "string", "description": "Model type: classification, regression"}
                    }
                }
            ]
            self._send_json_response({"tools": tools})
        
        elif self.path == '/':
            self._send_json_response({
                "message": "Data Science Copilot Python API",
                "version": "1.0.0",
                "endpoints": {
                    "health": "/health",
                    "tools": "/mcp/tools",
                    "clean": "/mcp/clean/drop_nulls",
                    "stats": "/mcp/stats/summary",
                    "plot": "/mcp/plot/generate",
                    "train": "/mcp/train"
                }
            })
        
        else:
            self._send_json_response({"error": "Endpoint not found"}, 404)
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            # Parse request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if self.path == '/mcp/clean/drop_nulls':
                result = drop_nulls(data['dataset_path'], data.get('columns'))
                self._send_json_response(result)
            
            elif self.path == '/mcp/stats/summary':
                result = compute_summary_stats(data['dataset_path'], data['column'])
                self._send_json_response(result)
            
            elif self.path == '/mcp/plot/generate':
                result = generate_plot(data['dataset_path'], data['type'], data['columns'])
                self._send_json_response(result)
            
            elif self.path == '/mcp/train':
                result = train_model(
                    data['dataset_path'],
                    data['features'],
                    data['target'],
                    data['type']
                )
                self._send_json_response(result)
            
            else:
                self._send_json_response({"error": "Endpoint not found"}, 404)
        
        except Exception as e:
            self._send_json_response({"error": str(e)}, 500)

def run_server(port=3000):
    """Run the data science API server"""
    with socketserver.TCPServer(("", port), DataScienceAPIHandler) as httpd:
        print(f"🚀 Data Science API Server running at http://localhost:{port}")
        print(f"📊 Health check: http://localhost:{port}/health")
        print(f"🔧 Available tools: http://localhost:{port}/mcp/tools")
        print(f"📚 API Documentation: http://localhost:{port}/")
        print("\nPress Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")

if __name__ == "__main__":
    run_server()
