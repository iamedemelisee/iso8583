const tls = require('tls');
const fs = require('fs');
const util = require('util');
const emv = require('node-emv');
const express = require('express');
const bodyParser = require('body-parser');
const hexdump = require('hexdump-nodejs');

const app = express();
app.use(bodyParser.json());
const {packISO, unpackISO, logISO, generateNetworkMessage, checkResponseTimeout, setNetworkState, sendNetworkMessage, formatNetworkMessage, initCLI_logs, generateBitmap, bitmapToHEX, getNetworkState, getProtocol, getMTI, getHeader, packDataElements, checkFormatIsoJson, decodeMTI, setDate, setLogDate, checkIsoFields} = require('./utils');
const isoDefaultSpecs = require('./specs/gim-sid.json');
const NETWORK_MESSAGE = require('./mti/1804.json');

const HOST = '127.0.0.1';
const PORT = 3000;

let message = '';
let now = setDate();

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
  let logDate = setLogDate();
  const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
};



const socket = tls.connect(options, () => {
  message += initCLI_logs(socket, now);
  console.log(message);
  let logDate = setLogDate();
  const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
  fs.appendFileSync(`${logFileName}`, message);
  message ='';
});

socket.on('secureConnect', () => {
  //let netState = setNetworkState("Sign-Off");
  
  message += util.format('[%s] - INFO\t:\tChecking server certificate\t[...]\n', now);
  message += util.format('[%s] - INFO\t:\t%s\n', now, socket.authorized ? 'Authorized server' : 'Unauthorized server');
  message += util.format('[%s] - INFO\t:\tConnected successfully to TLS server\n', now);
  message += util.format('[%s] - ***********************************************************************', now);
  const timeout = 5000; // Exemple de délai de 5 secondes
  const resTimeout = checkResponseTimeout(socket, timeout, 3)
  message += resTimeout.message;
  setNetworkState(message.netstate);
  console.log(message);
  let logDate = setLogDate();
  const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
  fs.appendFileSync(`${logFileName}`, message + '\n');
  message ='';
});

socket.on('close', () => {
  handleClose();
});

socket.on('error', (error) => {
  handleError(error);
});

app.post('/api/sendISO', (req, res) => {
  let netState = getNetworkState();
  if (req.body) {
    const apiReq = req.body;
    if (netState==="Sign-Off"){
      let snow = setDate();
      const validJsonISO = checkFormatIsoJson(apiReq, snow);
      message += util.format('[%s] - INFO\t:\tJSON Data recieved\n', snow);
      message += util.format('[%s] - ***********************************************************************\n', snow);
      message += util.format('[%s] - INFO\t:\tConn. state is Sign-Off. Cannot send ISO Payload to server\n', snow);
      message += util.format('[%s] - ***********************************************************************\n', snow);
      console.log(message);
      let logDate = setLogDate();
      const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
      fs.appendFileSync(`${logFileName}`, message + '\n');
      message ='';
    } else {
      let snow = setDate();
      let isoPayloadReq = '';
      const validJsonISO = checkFormatIsoJson(apiReq, snow);
      message += util.format('[%s] - INFO\t:\tJSON Data recieved\n', snow);
      if (validJsonISO.errr===1) {
        message +=validJsonISO.msss;
        message += util.format('[%s] - FATAL\t:\tCannot continue - Invalid MTI \n', snow);
        message += util.format('[%s] - ***********************************************************************\n', snow);
        message += util.format('[%s] - INFO\t:\tAwating data to send to server [...]\n', snow);
        message += util.format('[%s] - ***********************************************************************\n', snow);
        console.log(message);
        let logDate = setLogDate();
        const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
        fs.appendFileSync(`${logFileName}`, message + '\n');
        message ='';
      }
      else {
        message +=validJsonISO.msss;
        const MTI = getMTI(apiReq);
        const dMTI = decodeMTI(MTI, snow);
        if (dMTI.errr===1) {
          message +=dMTI.msss;
          message += util.format('[%s] - FATAL\t:\tCannot continue - Error decoding MTI\n', snow);
          message += util.format('[%s] - ***********************************************************************\n', snow);
          message += util.format('[%s] - INFO\t:\tAwating data to send to server [...]\n', snow);
          message += util.format('[%s] - ***********************************************************************\n', snow);
          console.log(message);
          let logDate = setLogDate();
          const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
          fs.appendFileSync(`${logFileName}`, message + '\n');
          message ='';
        }
        else {
          message +=dMTI.msss;
          const m_protocol = getProtocol();
          const m_header = getHeader();
          const bitmap_bin = generateBitmap(apiReq);
          const bitmap_hex = bitmapToHEX(bitmap_bin);
    
          message += util.format('[%s] - ***********************************************************************\n', snow);
          message += util.format('[%s] - DATA\t:\tProtocol id.\t:\t[%s]\n', snow, m_protocol);
          message += util.format('[%s] - DATA\t:\tMessage header\t:\t[%s]\n', snow, m_header);
          message += util.format('[%s] - DATA\t:\tMessage MTI\t:\t[%s]\n', snow, MTI);
          message += util.format('[%s] - DATA\t:\tBitmap HEX\t:\t[%s]\n', snow, bitmap_hex.replace(/(.{2})/g, '$1 ').trim());
          message += util.format('[%s] - ***********************************************************************\n', snow);
          message += util.format('[%s] - \tISO Message Fields Data elements :\n', snow);
          message += logISO(apiReq,isoDefaultSpecs, snow);
          message += util.format('[%s] - INFO\t:\tPackaging to ISO payload\t[...]\n', snow);
          const checkpackedDataElements = packDataElements(apiReq).errr;
          const packedDataElements = packDataElements(apiReq).dataElements;
          if (checkpackedDataElements===1) {
            message += util.format('[%s] - ERROR\t:\tPackaging to ISO payload failed\n', snow);
            console.log(message);
            let logDate = setLogDate();
            const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
            fs.appendFileSync(`${logFileName}`, message + '\n');
            message ='';
          } else {
            const m_length = m_protocol.length + m_header.length + 4 + 64 + packedDataElements.length;
            isoPayloadReq += m_length.toString().padStart(4,'0') + m_protocol + m_header + MTI + bitmap_hex + packedDataElements;
            const isoPayloadReq_hexdump = Buffer.from(isoPayloadReq, 'ascii');
            message += util.format('%s', hexdump(isoPayloadReq_hexdump).replace(/^/gm, match => `[${snow}] - \t`));
            message += util.format('\n[%s] - INFO\tRequest sent to server\n', snow);
            socket.write(isoPayloadReq);
            message += util.format('[%s] - ***********************************************************************\n', snow);
            message += util.format('[%s] - INFO\t:\tAwating response from server [...]\n', snow);
            message += util.format('[%s] - ***********************************************************************\n', snow);
            console.log(message);
            let logDate = setLogDate();
            const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
            fs.appendFileSync(`${logFileName}`, message + '\n');
            message ='';
          }
          
        }
      }
    }
  }
});

app.listen(5000, () => {});