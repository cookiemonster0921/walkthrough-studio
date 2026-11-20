// Optional loopback-only server. The studio also opens directly as a local file.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8'};
const server = http.createServer(async (req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = requested === '/' ? '/studio/index.html' : requested.endsWith('/') ? requested + 'index.html' : requested;
    const file = await fs.realpath(path.join(root, relative));
    if (!file.startsWith(root + path.sep) || !types[path.extname(file)] || relative.split('/').some(s=>s.startsWith('.'))) {res.writeHead(403); return res.end();}
    const data = await fs.readFile(file);
    res.writeHead(200, {'Content-Type':types[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log(`Open http://127.0.0.1:${server.address().port}/studio/`));
