import { spawn } from 'child_process';
import http from 'http';

const activeProcesses = new Set();

/**
 * Creates a SSE proxy for a Stdio-based MCP server
 */
const createProxy = (name, binaryPath, args, port) => {
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/sse')) {
      console.log(`[${name}] New SSE connection established on port ${port}`);
      
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Launch the local binary installed in node_modules
      const child = spawn('node', [binaryPath, ...args], { stdio: ['pipe', 'pipe', 'inherit'] });
      activeProcesses.add(child);

      child.stdout.on('data', (data) => {
        res.write(`data: ${data.toString()}\n\n`);
      });

      // Clean up on connection close
      req.on('close', () => {
        console.log(`[${name}] Connection closed, killing child process`);
        child.kill();
        activeProcesses.delete(child);
      });
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] 🚀 MCP ${name} active on port ${port}`);
  });
  
  return server;
};

// Paths to the entry points of installed MCP servers
const filesystemServer = './node_modules/@modelcontextprotocol/server-filesystem/dist/index.js';
const memoryServer = './node_modules/@modelcontextprotocol/server-memory/dist/index.js';

// Initialize proxies
const s1 = createProxy('FILESYSTEM', filesystemServer, ['/data/documents'], 5000);
const s2 = createProxy('MEMORY', memoryServer, [], 5001);

// --- GRACEFUL SHUTDOWN MANAGEMENT ---
const shutdown = () => {
  console.log('Stopping MCP servers...');
  s1.close();
  s2.close();
  activeProcesses.forEach(proc => proc.kill());
  process.exit(0);
};

// Listen for termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
