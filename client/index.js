const tls = require('tls');
const fs = require('fs');
const util = require('util');
const emv = require('node-emv');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const {packISO, unpackISO, logISO, initCLI_logs} = require('./utils');
const isoDefaultSpecs = require('./specs/iso-fields-default-config.json');

const HOST = '127.0.0.1';
const PORT = 3000;

let message = '';
let now = new Date().toLocaleString();

const options = {
  key: fs.readFileSync('cert/cli-key.pem'),
  cert: fs.readFileSync('cert/cli-cert.pem'),
  ca: [fs.readFileSync('cert/srv-cert.pem')],
  host: HOST,
  port: PORT,
  rejectUnauthorized: true
};



if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

const handleClose = () => {
  message += util.format('[%s] - EVENT : Connection closed : \n', now);
};

const handleError = (error) => {
  message += util.format('[%s] - ERROR : Error occurred : %s\n', now, error.message);
  console.log(message);
  fs.appendFileSync(`logs/cli_log.txt`, message + '\n');
};

const handleMessage = (data) => {
  let rnow = new Date().toLocaleString();
  const isoMessageRes = data.toString();
  message += util.format('[%s] - INFO : Client recieved data from server\n', rnow);
  message += util.format('[%s] - DATA : Payload data recieved\n', rnow);
  message += util.format('[%s] - %s\n', rnow, isoMessageRes);
  message += util.format('[%s] - INFO : Unpacking in ISO message [...]\n', rnow);
  message += util.format('[%s] - INFO : Successfull\n', rnow);
  message += util.format('[%s] - DATA : Data Fields\n', rnow);
  message += util.format('[%s] - ***************************************\n', rnow);
  const isoMessageRes_SRV_To_ISO_Fields = unpackISO(isoMessageRes);
  message += logISO(isoMessageRes_SRV_To_ISO_Fields,isoDefaultSpecs, rnow);
  message += util.format('[%s] - ***************************************\n', rnow);
  message += util.format('[%s] - INFO : Awating data to send to server [...]\n', rnow);
  message += util.format('[%s] - ***************************************', rnow);
  console.log(message);
  fs.appendFileSync(`logs/cli_log.txt`, message + '\n');
  message ='';
}

const socket = tls.connect(options, () => {
  message += initCLI_logs(socket, now);
});

socket.on('data', (data) => {
  handleMessage(data);
});

socket.on('close', () => {
  handleClose();
});

socket.on('error', (error) => {
  handleError(error);
});

app.post('/api/sendISO', (req, res) => {
  if (req.body) {
    let snow = new Date().toLocaleString();
    message += util.format('[%s] - INFO : JSON Data recieved\n', snow);
    const apiReq = req.body;
    message += util.format('[%s] - INFO : Packing in ISO message [...]\n', snow);
    const isoPayloadReq = packISO(apiReq);
    message += util.format('[%s] - INFO : Successfull\n', snow);
    message += util.format('[%s] - DATA : Data Fields\n', snow);
    const isoFieldsReq = unpackISO(isoPayloadReq);
    message += util.format('[%s] - ***************************************\n', snow);
    message += logISO(isoFieldsReq,isoDefaultSpecs, snow);
    message += util.format('[%s] - ***************************************\n', snow);
    message += util.format('[%s] - INFO : Sending request [...]\n', snow);
    socket.write(isoPayloadReq);
    message += util.format('[%s] - INFO : Client sent request to server\n', snow);
    message += util.format('[%s] - DATA : Sent request as payload\n', snow);
    message += util.format('[%s] - %s\n', snow, isoPayloadReq);
  
  }
});

app.listen(5000, () => {});