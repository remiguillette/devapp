const http = require('http');
const os = require('os');

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        port: PORT,
        host: os.hostname(),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Neutralino Node backend running on port ' + PORT + '\n');
});

server.listen(PORT, () => {
  console.log(`Node backend listening on http://localhost:${PORT}`);
});
