import { spawn } from 'child_process';
import http from 'http';
import path from 'path';

const createProxy = (name, binaryPath, args, port) => {
  http.createServer((req, res) => {
    if (req.url.startsWith('/sse')) {
      console.log(`[${name}] Connexion SSE établie sur le port ${port}`);
      
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Add prebuild binary
      const child = spawn('node', [binaryPath, ...args], { stdio: ['pipe', 'pipe', 'inherit'] });

      child.stdout.on('data', (data) => {
        res.write(`data: ${data.toString()}\n\n`);
      });

      req.on('close', () => {
        console.log(`[${name}] Connexion fermée`);
        child.kill();
      });
    }
  }).listen(port, () => {
    console.log(`🚀 MCP ${name} (version figée) prêt sur le port ${port}`);
  });
};

// Path to serve each part
const filesystemServer = './node_modules/@modelcontextprotocol/server-filesystem/dist/index.js';
const memoryServer = './node_modules/@modelcontextprotocol/server-memory/dist/index.js';

// Proxys startup
createProxy('FILESYSTEM', filesystemServer, ['/data/documents'], 5000);
createProxy('MEMORY', memoryServer, [], 5001);
