
# MCP SSE Bridge 🚀

A lightweight, production-ready Dockerized bridge that transforms **Stdio-based** Model Context Protocol (MCP) servers into **SSE (Server-Sent Events) HTTP servers**.

This bridge allows platforms like **Open WebUI** to communicate with MCP servers that do not natively support network/HTTP connections, specifically the **Filesystem** and **Memory** servers.

## ✨ Features

- **Network Access**: Exposes Stdio-based MCP servers over HTTP/SSE.
- **Production Ready**: Built with Node.js 22-slim, featuring non-root security (`USER node`) and graceful shutdown management (`SIGTERM`).
- **Dual-Service**: Hosts both `filesystem` and `memory` servers in a single optimized container.
- **Health Checked**: Includes built-in Docker healthchecks to ensure service availability.
- **CI/CD Integrated**: Automatically builds and pushes to GitHub Container Registry (GHCR) on new releases.

## 🏗 Architecture

The bridge acts as a translator between web-based interfaces and local process communication:
`Open WebUI (HTTP/SSE)` ↔ `MCP Bridge (Node.js)` ↔ `MCP Server (Stdio/Spawned Process)`

## 🚀 Installation

### Using GitHub Container Registry (Recommended)
Update your `docker-compose.yml` to use the image from your GHCR:

```yaml
services:
  mcp-bridge:
    image: ghcr.io/${GITHUB_USERNAME}/${REPO_NAME}:v1.0.0
    container_name: mcp-bridge
    restart: always
    ports:
      - "5000:5000" # Filesystem Bridge
      - "5001:5001" # Memory Bridge
    volumes:
      - ./documents:/data/documents:rw
      - ./memory_data:/data/memory:rw
```
# Local Build

If you want to build the image locally on your machine:

```bash
docker build -t mcp-bridge:local .
```
## ⚙️ Configuration in Open WebUI

Navigate to Settings > Documents > MCP Servers and add the following configuration:

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "sse",
      "url": "http://mcp-bridge:5000/sse"
    },
    "memory": {
      "type": "sse",
      "url": "http://mcp-bridge:5001/sse"
    }
  }
}
```

## 📂 Internal Paths

When prompting your AI (Vibecoding), use these internal container paths:

- Documents Directory: /data/documents
- Memory Storage: Managed internally (mapped to /data/memory)

## 🛠 Development

File Structure

- mcp-bridge.js: Core proxy logic with signal handling.
- Dockerfile: Multi-stage build with healthchecks and security best practices.
- package.json: Locked dependencies for stability.
- .dockerignore: Optimized build context.
- 
Commands

- Start local development: npm install && node mcp-bridge.js
- Check health: curl -f http://localhost:5000/sse

## 🛡 Security
- Non-Root: The process runs under the node user.
- Isolation: Filesystem access is strictly restricted to the mounted /data/documents directory.
- Signal Handling: Properly kills child processes on container stop to prevent zombie processes.
  

# 🔍 Troubleshooting

## Container Exit Codes

Code 0: Usually means the Node.js process finished its task. Ensure your mcp-bridge.js is correctly detecting the SSE requests and that the ports are not already in use.

Code 137: OOM (Out of Memory) or a forceful kill. Ensure your host has enough RAM allocated to the Docker daemon.

## Common Errors

- Error: ENOENT: no such file or directory, stat '/--port': This happens if you try to pass --port directly to the filesystem server. Use the bridge proxy instead as documented.

- Permission Denied: Ensure the ./documents and ./memory_data folders on your host are accessible by the container user (UID 1000).
```bash
sudo chown -R 1000:1000 ./documents ./memory_data
```
