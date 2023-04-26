var tls = require('tls');
var fs = require('fs');
const util = require('util');
const emv = require('node-emv');
const isoMessageRes = require('./mti/0210.json');
const isoDefaultSpecs = require('./specs/iso-fields-default-config.json');
const PORT = 3000;
const HOST = '127.0.0.1';
const {packISO, unpackISO, logISO, initSRV_logs} = require('./utils');

const now = new Date().toLocaleString();
let message = '';
const options = {
  key: fs.readFileSync('cert/srv-key.pem'),
  cert: fs.readFileSync('cert/srv-cert.pem'),
  ca: fs.readFileSync('cert/cli-cert.pem'),
  requestCert: true,
  rejectUnauthorized: true,
};

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

const server = tls.createServer(options,(socket) => {
  message += initSRV_logs(socket);
  socket.on('data', (data) => {
    const isoMessageReq_CLI = data.toString();
    message += util.format('[%s] - INFO : Payload data recieved\n', now);
    message += util.format('[%s] - DATA : %s\n', now, isoMessageReq_CLI);
    message += util.format('[%s] - INFO : Unpacking in ISO message [...]\n', now);
    const isoFieldsReq = unpackISO(isoMessageReq_CLI);
    message += util.format('[%s] - INFO : Successfull\n', now);
    message += util.format('[%s] - DATA : Data Fields\n', now);
    message += util.format('[%s] - ***************************************\n', now);
    message += logISO(isoFieldsReq,isoDefaultSpecs);
    message += util.format('[%s] - ***************************************\n', now);
    message += util.format('[%s] - INFO : Sending reponse [...]\n', now);
    message += util.format('[%s] - DATA : Server sent response as payload\n', now);
    const isoPayloadRes = packISO(isoMessageRes);
    socket.write(isoPayloadRes);
    message += util.format('[%s] - %s\n', now, isoPayloadRes);
    message += util.format('[%s] - INFO : Packing response ISO message [...]\n', now);
    message += util.format('[%s] - INFO : Successfull\n', now);
    message += util.format('[%s] - DATA : Data Fields\n', now);
    message += util.format('[%s] - ***************************************\n', now);
    const isoPayloadResFields = unpackISO(isoPayloadRes);
    message += logISO(isoPayloadResFields,isoDefaultSpecs);
    message += util.format('[%s] - ***************************************\n', now);
    message += util.format('[%s] - INFO : Awaiting client to send data [...]\n', now);
    message += util.format('[%s] - ***************************************', now);
    console.log(message);
    fs.appendFileSync(`logs/srv_log.txt`, message + '\n');
    message = ''
  });
  
  socket.on('end', () => {
    console.log(`Client ${socket.remoteAddress}:${socket.remotePort} disconnected`);
  });
  
  socket.on('error', (err) => {
    message += util.format('[%s] - ERROR : Error occurred with client %s:%s ==> %s\n', now, socket.remoteAddress, socket.remotePort, err);
    console.log(`${now} - ERROR : Error occurred with client ${socket.remoteAddress}:${socket.remotePort} ==> ${err}`);
  });
});
server.listen(PORT, HOST, () => {
  message += util.format('[%s] - INFO : Server running on %s:%s [...]\n', now, HOST, PORT);
});
