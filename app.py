#!/usr/bin/env python3
"""Local development server for the DeepFind static app.

Run:
    python app.py

Then open:
    http://127.0.0.1:8000
"""

from __future__ import annotations

import argparse
import http.server
import socketserver
from pathlib import Path


ROOT = Path(__file__).resolve().parent


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the DeepFind local web server.")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind. Default: 127.0.0.1")
    parser.add_argument("--port", default=8000, type=int, help="Port to bind. Default: 8000")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    handler = lambda *handler_args, **handler_kwargs: http.server.SimpleHTTPRequestHandler(  # noqa: E731
        *handler_args,
        directory=str(ROOT),
        **handler_kwargs,
    )

    with ReusableTCPServer((args.host, args.port), handler) as httpd:
        print(f"DeepFind server running at http://{args.host}:{args.port}")
        print(f"Serving files from {ROOT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
