const fs = require('fs');
const tls = require('tls');
const path = require('path');

const options = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.crt')),
};

const server = tls.createServer(options, (socket) => {
  console.log('Client connected:', socket.remoteAddress + ':' + socket.remotePort);

  socket.write('Welcome to the TLS secured server!\n');
  socket.setEncoding('utf8');

  socket.on('data', (data) => {
    console.log(`Received data from client: ${data}`);
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });

  socket.on('error', (err) => {
    console.error(`Socket error: ${err}`);
  });
});

server.listen(8000, () => {
  console.log('TLS server started on port 8000');
});
