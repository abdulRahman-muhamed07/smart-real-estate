const http = require('http');
const fs = require('fs');
const path = require('path');

const FRONTEND_PORT = 8000;
const BACKEND_URL = 'http://localhost:5001';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
};

function serveStatic(req, res) {
    let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
}

function proxyToBackend(req, res) {
    const target = new URL(req.url, BACKEND_URL);
    const options = {
        hostname: target.hostname,
        port: target.port,
        path: target.pathname + target.search,
        method: req.method,
        headers: { ...req.headers, host: target.host },
    };

    const proxy = http.request(options, (backendRes) => {
        res.writeHead(backendRes.statusCode, backendRes.headers);
        backendRes.pipe(res);
    });

    proxy.on('error', (err) => {
        res.writeHead(502);
        res.end('Backend unavailable: ' + err.message);
    });

    req.pipe(proxy);
}

const server = http.createServer((req, res) => {
    if (req.url.startsWith('/api/')) {
        proxyToBackend(req, res);
    } else {
        serveStatic(req, res);
    }
});

server.listen(FRONTEND_PORT, () => {
    console.log(`Dev server: http://localhost:${FRONTEND_PORT}`);
    console.log(`API proxy:  /api/* -> ${BACKEND_URL}`);
});
