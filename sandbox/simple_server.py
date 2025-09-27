#!/usr/bin/env python3
import http.server
import socketserver
import json

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"status": "ok"}
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/mcp/tools':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                "tools": [
                    {
                        "name": "drop_nulls",
                        "description": "Remove rows with null values from dataset"
                    },
                    {
                        "name": "summary_stats", 
                        "description": "Compute summary statistics for a column"
                    },
                    {
                        "name": "generate_plot",
                        "description": "Generate Plotly visualization"
                    },
                    {
                        "name": "train_model",
                        "description": "Train a machine learning model"
                    }
                ]
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    PORT = 8080
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print("Available endpoints:")
        print("  GET /health")
        print("  GET /mcp/tools")
        httpd.serve_forever()
