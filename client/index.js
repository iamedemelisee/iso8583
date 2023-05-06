const tls = require('tls');
const fs = require('fs');
const util = require('util');
const emv = require('node-emv');
const express = require('express');
const bodyParser = require('body-parser');
const hexdump = require('hexdump-nodejs');

const app = express();
app.use(bodyParser.json());
const {packISO, unpackISO, logISO, initCLI_logs, generateBitmap, bitmapToHEX, getProtocol, getMTI, getHeader, packDataElements, checkFormatIsoJson, decodeMTI} = require('./utils');
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
  message += util.format('[%s] - INFO : Client recieved response from server\n', rnow);
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
    const apiReq = req.body;
    let isoPayloadReq = '';
    let snow = new Date().toLocaleString();
    const validJsonISO = checkFormatIsoJson(apiReq, snow);
    message += util.format('[%s] - INFO : JSON Data recieved\n', snow);
    if (validJsonISO.errr===1) {
      message +=validJsonISO.msss;
      message += util.format('[%s] - FATAL : Cannot continue - Invalid MTI \n', snow);
      message += util.format('[%s] - ***************************************\n', snow);
      message += util.format('[%s] - INFO : Awating data to send to server [...]\n', snow);
      message += util.format('[%s] - ***************************************', snow);
      console.log(message);
      fs.appendFileSync(`logs/cli_log.txt`, message + '\n');
      message ='';
    }
    else {
      message +=validJsonISO.msss;
      const MTI = getMTI(apiReq);
      const dMTI = decodeMTI(MTI, snow);
      if (dMTI.errr===1) {
        message +=dMTI.msss;
        message += util.format('[%s] - FATAL : Cannot continue - Error decoding MTI\n', snow);
        message += util.format('[%s] - ***************************************\n', snow);
        message += util.format('[%s] - INFO : Awating data to send to server [...]\n', snow);
        message += util.format('[%s] - ***************************************', snow);
        console.log(message);
        fs.appendFileSync(`logs/cli_log.txt`, message + '\n');
        message ='';
      }
      else {
        message +=dMTI.msss;
        const m_protocol = getProtocol();
        const m_header = getHeader();
        const bitmap_bin = generateBitmap(apiReq);
        const bitmap_hex = bitmapToHEX(bitmap_bin);
        const packedDataElements = packDataElements(apiReq);
        const m_length = m_protocol.length + m_header.length + 4 + 64 + packedDataElements.length;
        message += util.format('[%s] - ***************************************\n', snow);
        message += util.format('[%s] - DATA : Message length : [%s]\n', snow, m_length.toString().padStart(4,'0'));
        message += util.format('[%s] - DATA : Protocol identification : %s\n', snow, m_protocol);
        message += util.format('[%s] - DATA : Message header : %s\n', snow, m_header);
        message += util.format('[%s] - DATA : MTI : [%s]\n', snow, MTI);
        message += util.format('[%s] - DATA : Bitmap HEX : %s\n', snow, bitmap_hex.replace(/(.{2})/g, '$1 ').trim());
        message += util.format('[%s] - DATA : Data elements :\n', snow);
        message += logISO(apiReq,isoDefaultSpecs, snow);
        message += util.format('[%s] - INFO : Hexdump :\n', snow);
        isoPayloadReq += m_length.toString().padStart(4,'0') + m_protocol + m_header + MTI + bitmap_hex + packedDataElements;
        const isoPayloadReq_hexdump = Buffer.from(isoPayloadReq, 'ascii');
        message += util.format('%s', hexdump(isoPayloadReq_hexdump));
        message += util.format('[%s] - INFO : Request sent to server\n', snow);
        socket.write(isoPayloadReq);
        message += util.format('[%s] - ***************************************\n', snow);
        message += util.format('[%s] - INFO : Awating response from server [...]\n', snow);
        message += util.format('[%s] - ***************************************\n', snow);
      }
    }
  }
});

app.listen(5000, () => {});