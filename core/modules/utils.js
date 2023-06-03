const util = require('util');
const tls = require('tls');
const fs = require('fs');
const crypto = require('crypto');
const params = require('../configs/config.json');
const emv = require('node-emv');
const hexdump = require('hexdump-nodejs');
let conn_state = "Sign-Off";

function getcliConfigs(){
    return {ckey : params.setcli.keyPath, cCert : params.setcli.certPath, sCert : params.setcli.switchCertPath, cIP : params.setcli.IP, cPort : params.setcli.Port, cReqCert : params.setcli.requestCert, cRejUnauth : params.setcli.rejectUnauthorized}
}

function getswitchConfigs(){
    return {skey : params.setswitch.keyPath, sCert : params.setswitch.certPath, cCert : params.setswitch.cliCertPath, sIP : params.setswitch.IP, sPort : params.setswitch.Port, sReqCert : params.setswitch.requestCert, sRejUnauth : params.setswitch.rejectUnauthorized};
}

function getNetManagementConfigs(){
    return {timeoutNetMReqSec : (params.networkmanagement.timeoutNetMReqSec*1000), retryNetMReqCount : params.networkmanagement.retryNetMReqCount}
}

function isNumber(str) {
    const regex = /^\d+$/;
    return regex.test(str);
}

function padRight(string, length, paddingChar) {
    const paddingLength = Math.max(0, length - string.length);
    return string + paddingChar.repeat(paddingLength);
}

function binaryToHex(bitmap_bin){
    const binaryString = bitmap_bin.match(/.{1,8}/g).map(byte => parseInt(byte, 2).toString(16).padStart(2, '0')).join('');
    const bitmap_hex = binaryString.toUpperCase();
    return bitmap_hex;
}

function hexToBinary(bitmap_hex){
    const hexString = bitmap_hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16).toString(2).padStart(8, '0')).join('');
    const bitmap_bin = hexString.toUpperCase();
    return bitmap_bin;
}

function getNetworkState(){
    return conn_state;
}

function setNetworkState(networkState){
    conn_state = networkState;
    return conn_state;
}


function setDate(){
    const now = new Date();
    const YYYY = now.getFullYear().toString();
    const MM = (now.getMonth() + 1).toString().padStart(2,'0'); 
    const dd = now.getDate().toString().padStart(2,'0');
    const HH = now.getHours().toString().padStart(2,'0');
    const mm = now.getMinutes().toString().padStart(2,'0');
    const ss = now.getSeconds().toString().padStart(2,'0');
    const mmm = now.getMilliseconds().toString().padStart(3,'0');
    const dateFormatted = dd+'-'+MM+'-'+YYYY+' '+HH+':'+mm+':'+ss+'.'+mmm
    return dateFormatted;
}

function setLogDate(){
    const now = new Date();
    const YYYY = now.getFullYear().toString();
    const MM = (now.getMonth() + 1).toString().padStart(2,'0'); 
    const dd = now.getDate().toString().padStart(2,'0');
    const HH = now.getHours().toString().padStart(2,'0');
    const mm = now.getMinutes().toString().padStart(2,'0');
    const ss = now.getSeconds().toString().padStart(2,'0');
    const mmm = now.getMilliseconds().toString().padStart(3,'0');
    const logDateFormatted = YYYY+'_'+MM+'_'+dd+' '+HH+'0000';
    return logDateFormatted;
}

function setNewCliLogs(socket){
    let ms = "";
    let now = setDate();
    ms += util.format('[%s] - **********************************************************************************************************************\n', now);
    ms += util.format('[%s] - INFO\t:\tClient connected to switch\n', now);
    ms += util.format('[%s] - ***********************************************************************', now);
    return ms;
}

function setNewSwitchLogs(socket){
    let ms = "";
    let now = setDate();
    ms += util.format('[%s] - **********************************************************************************************************************\n', now);
    ms += util.format('[%s] - INFO\t:\tSwitch has new client connected\n', now);
    ms += util.format('[%s] - ***********************************************************************\n', now);
    return ms;
}


function cli_handleClose(){
    let ms = "";
    let now = setDate();
    ms += util.format('[%s] - EVENT\t:\tConnection closed : \n', now);
    return ms;
}

function cli_handleError(error){
    let ms = "";
    let now = setDate();
    ms += util.format('[%s] - ERROR\t:\tError occurred : %s\n', now, error.message);
    return ms;
}

function cli_handleConnect(socket){
    let ms = "";
    ms += init_cli_logs(socket);
    return ms;
}

function getProtocol() {
    return params.protocolname;
}

function getMTI(jsonMessage) {
    const mti = jsonMessage['000'];
    return mti;
}

function getMTI(jsonMessage) {
    const mti = jsonMessage['000'];
    return mti;
}

function getHeader() {
    const header = params.header.interface + params.header.protocolversion + params.header.formatindicator;
    return header;
}

function decodeMTI(mti){
    let now = setDate();
    let ms ='';
    let err = 0;
    const mti_iso_8583_version = mti.substring(0,1);
    const mti_iso_8583_message_class = mti.substring(1,2);
    const mti_iso_8583_message_func = mti.substring(2,3);
    const mti_iso_8583_message_org = mti.substring(3,4);

    const mti_specs_iso_8583_version = Object.keys(params.mti.iso8583version);
    const mti_specs_iso_8583_message_class = Object.keys(params.mti.iso8583msgclass);
    const mti_specs_iso_8583_message_func = Object.keys(params.mti.iso8583msgfunc);
    const mti_specs_iso_8583_message_org = Object.keys(params.mti.iso8583msgorigin);

    if (mti_specs_iso_8583_version.includes(mti_iso_8583_version)) {
        const iv_value = params.mti.iso8583version[mti_iso_8583_version];
        ms += util.format('[%s] - INFO\t:\tISO853 VERSION\t:\t[%s]\n', now, iv_value);
        if (mti_specs_iso_8583_message_class.includes(mti_iso_8583_message_class)) {
        const mc_value = params.mti.iso8583msgclass[mti_iso_8583_message_class];
        ms += util.format('[%s] - INFO\t:\tMESSAGE CLASS\t:\t[%s]\n', now, mc_value);
        if (mti_specs_iso_8583_message_func.includes(mti_iso_8583_message_func)) {
            const mf_value = params.mti.iso8583msgfunc[mti_iso_8583_message_func];
            ms += util.format('[%s] - INFO\t:\tMESSAGE FUNC.\t:\t[%s]\n', now, mf_value);
            if (mti_specs_iso_8583_message_org.includes(mti_iso_8583_message_org)) {
            const mo_value = params.mti.iso8583msgorigin[mti_iso_8583_message_org];
            ms += util.format('[%s] - INFO\t:\tMESSAGE ORIGIN\t:\t[%s]\n', now, mo_value);
            } else {
            ms += util.format('[%s] - ERROR\t:\tUnknown message origin\n', now);
            err = 1;
            }
        } else {
            ms += util.format('[%s] - ERROR\t:\tUnknown message function\n', now);
            err = 1;
        }
        } else {
        ms += util.format('[%s] - ERROR\t:\tUnknown message class\n', now);
        err = 1;
        }
    } else {
        ms += util.format('[%s] - ERROR\t:\tUnknown ISO8583 Version\n', now);
        err = 1;
    }
    return {errr: err, msss: ms};
}

function generateBitmap(jsonMessage) {
    const bitmap = Array(params.bitmap.maxLength).fill('0');
    for (const field in jsonMessage) {
      const fieldNumber = parseInt(field);
      if (fieldNumber <= params.bitmap.maxLength) {
        bitmap[fieldNumber - 1] = '1';
      } else {
        throw new Error(`Le numéro de champ ${fieldNumber} dépasse le nombre maximum de bits dans le Bitmap ${_PARAMS.BITMAP_MAX_LENGTH}`);
      }
      let fieldsPresent = false;
      for (let i = 65; i < params.bitmap.maxLength; i++) {
        if (jsonMessage[i.toString()]) {
          fieldsPresent = true;
          break;
        }
      }
      if (fieldsPresent) {
        bitmap[0] = '1';
      }
    } 
    return bitmap.join('');
}

function bitmapToHEX(bitmap) {
    const bitmap_hex = bitmap.match(/.{1,8}/g).map(byte => parseInt(byte, 2).toString(16).padStart(2, '0')).join('').toUpperCase();
    return bitmap_hex;
}

function set_DE011() {
    const range = 1000000;
    const usedNumbers = new Set();

    while (true) {
        const randomNumber = crypto.randomInt(range);

        if (!usedNumbers.has(randomNumber)) {
        usedNumbers.add(randomNumber);
        return randomNumber.toString().padStart(6, '0');
        }

        
        if (usedNumbers.size === range) {
        throw new Error('Tous les nombres possibles ont été générés.');
        }
    }
}

function set_DE037() {
    const range = 1000000000000;
    const usedNumbers = new Set();

    while (true) {
        const randomNumber = crypto.randomInt(range);

        if (!usedNumbers.has(randomNumber)) {
        usedNumbers.add(randomNumber);
        return randomNumber.toString().padStart(12, '0');
        }
        if (usedNumbers.size === range) {
        throw new Error('Tous les nombres possibles ont été générés.');
        }
    }
}

function set_DE007(){
    const now = new Date();
    const YY = now.getFullYear().toString().substring(2,4);
    const MM = (now.getMonth() + 1).toString().padStart(2,'0'); 
    const dd = now.getDate().toString().padStart(2,'0');
    const HH = now.getHours().toString().padStart(2,'0');
    const mm = now.getMinutes().toString().padStart(2,'0');
    const dateFormatted = YY+MM+dd+HH+mm;
    return dateFormatted;
}

function set_DE012(){
    const now = new Date();
    const YY = now.getFullYear().toString().substring(2,4);
    const MM = (now.getMonth() + 1).toString().padStart(2,'0'); 
    const dd = now.getDate().toString().padStart(2,'0');
    const HH = now.getHours().toString().padStart(2,'0');
    const mm = now.getMinutes().toString().padStart(2,'0');
    const ss = now.getSeconds().toString().padStart(2,'0');
    const dateFormatted = YY+MM+dd+HH+mm+ss;
    return dateFormatted;
}


function set_DE033(){
    return "00000009991";
}

function generateNetworkMessage(DE_024) {
    const apiReq = {
        "000": "1804",
        "007": set_DE007(),
        "011": set_DE011(),
        "012": set_DE012(),
        "024": DE_024,
        "025": "0000",
        "033": set_DE033(),
        "037": set_DE037(),
        "128": "00000000"
    };
    const sortedKeys = Object.keys(apiReq).sort((a, b) => a.localeCompare(b));
    const sortedJson = {};
    sortedKeys.forEach(key => {
        sortedJson[key] = apiReq[key];
    });
    return sortedJson;
}

function checkFormatIsoJson(jsonMessage) {
    let now = setDate();
    let ms ='';
    let err = 0;
    if (!jsonMessage.hasOwnProperty("000")) {
      ms += util.format('[%s] - ERROR\t:\tMTI not sent\n', now);
      err = 1;
    }
    else {
      const g_mti = jsonMessage["000"];
      if (isNumber(g_mti)) {
        let g_mti_length = g_mti.length;
        if (g_mti_length!= params.mti.mtiLength) {
          ms += util.format('[%s] - ERROR\t:\tIncorrect MTI Length\n', now);
          err = 1;
        }
        else
        {
          ms += util.format('[%s] - INFO\t:\tCorrect MTI Length\n', now);
        }
      }
      else {
        ms += util.format('[%s] - ERR\t:\tMTI not a number\n', now);
        err = 1;
      }
    }
    return {errr: err, msss: ms };
}

function packDataElements(jsonMessage) {
    let err = 1;
    let isoMessage = "";
    const fields = Object.keys(jsonMessage).sort((a, b) => a - b);
    
    fields.forEach((field) => {
        if (params.datafields.hasOwnProperty(field)) {
            const fieldSpecs = params.datafields[field];
            const fieldValue = jsonMessage[field].toString();
            if (fieldSpecs.fixedLength === false) {
                const fieldLength = fieldValue.length.toString().padStart(2, '0');
                isoMessage += fieldLength + fieldValue;
                err = 0;
            } else {
                isoMessage += fieldValue;
                err = 0;
            }
        }
    });
    return {errr: err, dataElements: isoMessage};
}



function formatNetworkMessage(apiReq){
    let now = setDate();
    let err = 1;
    let message ='';
    let isoPayloadReq = '';
    let conn_st = getNetworkState();
    const validJsonISO = checkFormatIsoJson(apiReq);
    const netMTI = getMTI(apiReq);
    message += util.format('[%s] - INFO\t:\tMTI\t\t\t:\t[%s]\n', now, netMTI);
    message += util.format('[%s] - INFO\t:\tConn. state\t\t:\t[%s]\n', now, conn_st);
    if (validJsonISO.errr===1) {
        message +=validJsonISO.msss;
        message += util.format('[%s] - FATAL\t:\tCannot continue - Invalid MTI \n', now);
        message += util.format('[%s] - ***********************************************************************\n', now);
        message += util.format('[%s] - INFO\t:\tAwating data to send to server [...]\n', now);
        message += util.format('[%s] - ***********************************************************************\n', now);
    }
    else {
        const MTI = getMTI(apiReq);
        const dMTI = decodeMTI(MTI);
        if (dMTI.errr===1) {
        message +=dMTI.msss;
        message += util.format('[%s] - FATAL\t:\tCannot continue - Error decoding MTI\n', now);
        message += util.format('[%s] - ***********************************************************************\n', now);
        message += util.format('[%s] - INFO\t:\tAwating data to send to server [...]\n', now);
        message += util.format('[%s] - ***********************************************************************\n', now);
        } else {
            message +=dMTI.msss;
            const m_protocol = getProtocol();
            const m_header = getHeader();
            const bitmap_bin = generateBitmap(apiReq);
            const bitmap_hex = bitmapToHEX(bitmap_bin);

            message += util.format('[%s] - ***********************************************************************\n', now);
            //message += util.format('[%s] - DATA\t:\tMessage length\t:\t[%s]\n', snow, m_length.toString().padStart(4,'0'));
            message += util.format('[%s] - DATA\t:\tProtocol id.\t:\t[%s]\n', now, m_protocol);
            message += util.format('[%s] - DATA\t:\tMessage header\t:\t[%s]\n', now, m_header);
            //message += util.format('[%s] - DATA\t:\tMessage MTI\t:\t[%s]\n', now, MTI);
            message += util.format('[%s] - DATA\t:\tBitmap HEX\t:\t[%s]\n', now, bitmap_hex.replace(/(.{2})/g, '$1 ').trim());
            message += util.format('[%s] - ***********************************************************************\n', now);
            message += util.format('[%s] - \tISO Message Fields Data elements :\n', now);
            message += logDataFields(apiReq);
            message += util.format('[%s] - ***********************************************************************\n', now);

            message += util.format('[%s] - INFO\t:\tPackaging to ISO payload\t[...]\n', now);
            const checkpackedDataElements = packDataElements(apiReq).errr;
            const packedDataElements = packDataElements(apiReq).dataElements;
            if (checkpackedDataElements===1) {
                message += util.format('[%s] - ERROR\t:\tPackaging to ISO payload failed\n', now);
            } else {
                const m_length = m_protocol.length + m_header.length + 4 + 128 + packedDataElements.length;
                isoPayloadReq += m_length.toString().padStart(4,'0') + m_protocol + m_header + MTI + bitmap_hex + packedDataElements;
                const isoPayloadReq_hexdump = Buffer.from(isoPayloadReq, 'ascii');
                message += util.format('[%s] - ***********************************************************************\n', now);
                message += util.format('[%s] - \n', now);
                message += util.format('%s', hexdump(isoPayloadReq_hexdump).replace(/^/gm, match => `[${now}] - \t`));
                message += util.format('\n[%s] - ***********************************************************************\n', now);
                message += util.format('[%s] - INFO\t:\tSending request to server\t[...]\n', now);
                err = 0;
            }
        }
    }
    return {err : err, isoPayload : isoPayloadReq, message : message};
}

function logDataFields(jsonMessage){
    let now = setDate();
    let specs = params.datafields;
    let ms = "";
    const ikeys = Object.keys(jsonMessage).sort((a, b) => a - b).slice(1);
      ikeys.forEach((key) => {
        const value = jsonMessage[key];
        if (key == '055') {
          ms += util.format('[%s] -\t[F%s] [ICC data – EMV having multiple tags] :\n', now, key);
          emv.parse(value, function(data){
            if(data != null){
                data.forEach(element => {
                  ms += util.format('[%s] -\t\t%s : %s\n', now, padRight((element.tag).toString().padStart(4,' ')+' : ',15,'-'), (element.value).toString().toUpperCase());
                });
            }
          });
        }
        else {
          for (const [fkey, fvalue] of Object.entries(specs)) {
            let flabel =''
            
            if (fkey == key) {
              if (fvalue.label) {
                flabel = '['+fvalue.label+']';
              } else {
                flabel = '[NO DESC]';
              }
              ms += util.format('[%s] - \t[F%s] %s : %s\n', now, key, padRight(flabel+' : ',70,'-'),value);
            }
          }
        }
      });
    return ms;
}

function logPayloadISO(jsonMessage){
    let now = setDate();
    let specs = params.datafields;
    let ms = "";
    const ikeys = Object.keys(jsonMessage).sort((a, b) => a - b);
      ikeys.forEach((key) => {
        const value = jsonMessage[key];
        if (key == '055') {
          ms += util.format('[%s] -\t[F%s] [ICC data – EMV having multiple tags] :\n', now, key);
          emv.parse(value, function(data){
            if(data != null){
                data.forEach(element => {
                  ms += util.format('[%s] -\t\t%s : %s\n', now, padRight((element.tag).toString().padStart(4,' ')+' : ',15,'-'), (element.value).toString().toUpperCase());
                });
            }
          });
        }
        else {
          for (const [fkey, fvalue] of Object.entries(specs)) {
            let flabel =''
            
            if (fkey == key) {
              if (fvalue.label) {
                flabel = '['+fvalue.label+']';
              } else {
                flabel = '[NO DESC]';
              }
              ms += util.format('[%s] - \t[F%s] %s : %s\n', now, key, padRight(flabel+' : ',70,'-'),value);
            }
          }
        }
      });
    return ms;
  };

function sendNetworkMessage(socket){
    let inow = setDate();
    let ms = '';
    const apiReq = generateNetworkMessage(801);
    const res_sendNetworkMessage = formatNetworkMessage(apiReq);
    ms += res_sendNetworkMessage.message;
    if (res_sendNetworkMessage.err===0) {
        err = false;
        ms += util.format('[%s] - INFO\t:\tRequest sent to server\n', inow);
        socket.write(res_sendNetworkMessage.isoPayload);
        ms += util.format('[%s] - ***********************************************************************\n', inow);
        ms += util.format('[%s] - INFO\t:\tAwating response from server [...]\n', inow);
        ms += util.format('[%s] - ***********************************************************************', inow);
    } else {
        ms += util.format('[%s] - INFO\t:\tRequest failed to send to server\n', inow);
    }
    return ms;
}

function checkResponseTimeout(socket, timeout, counter) {
    let inow = setDate();
    let netState = setNetworkState("Sign-Off");
    let ms = '';
    let responseReceived = false;
    let j = 1;
    function sendNetworkMessageWithTimeout() {
        if (!responseReceived) {
        ms += sendNetworkMessage(socket);
        j++;
        if (j <= counter) {
            netState = setNetworkState("Sign-Off");
            setTimeout(sendNetworkMessageWithTimeout, timeout);
            console.log(ms);
            let logDate = setLogDate();
            const logFileName = 'logs/tls_cli_'+logDate+'.log';
            fs.appendFileSync(`${logFileName}`, ms + '\n');
            ms = '';
        } else {
            netState = setNetworkState("Sign-Off");
            ms += util.format('\n[%s] - *************************************************************************************************\n', inow);
            ms += util.format('[%s] - WARN\t:\tConn. set to Sign-Off. No reponse from server to network message request\n', inow);
            ms += util.format('[%s] - *************************************************************************************************', inow);
            console.log(ms);
            let logDate = setLogDate();
            const logFileName = 'logs/tls_cli_'+logDate+'.log';
            fs.appendFileSync(`${logFileName}`, ms + '\n');
            ms = '';
        }
        }
    }
    setTimeout(sendNetworkMessageWithTimeout, timeout);


    socket.on('data', (data) => {
        responseReceived = true;
        const isoPayload = data.toString();
        
        let ms = '';
        ms += logPayloadMessage(isoPayload);
        ms += util.format('=[%s] - ***********************************************************************\n', inow);
        ms += util.format('[%s] - INFO\t:\tAwating data to send to server\n', inow);
        ms += util.format('[%s] - ***********************************************************************\n', inow);
        console.log(ms);
        let logDate = setLogDate();
        const logFileName = 'logs/tls_cli_'+logDate+'.log';
        fs.appendFileSync(`${logFileName}`, ms + '\n');
        ms ='';

    });
    return {netstate : netState, message : ms};
}

function createNewClient(){

    const PORT = getcliConfigs().cPort || 3000;
    const HOST = getcliConfigs().cIP || '127.0.0.1';
    const options = {
        key: fs.readFileSync(getcliConfigs().ckey),
        cert: fs.readFileSync(getcliConfigs().cCert),
        ca: [fs.readFileSync(getcliConfigs().sCert)],
        host: getcliConfigs().cIP || '127.0.0.1',
        port: getcliConfigs().cPort || 3000,
        rejectUnauthorized: getcliConfigs().cRejUnauth
    };
    let message = '';
    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
    }
    const socket = tls.connect(options, () => {
        message += setNewCliLogs(socket);
        console.log(message);
        let logDate = setLogDate();
        const logFileName = 'logs/tls_cli_'+logDate+'.log';
        fs.appendFileSync(`${logFileName}`, message);
        message ='';
    });

    socket.on('secureConnect', () => {
        const resTimeout = checkResponseTimeout(socket, getNetManagementConfigs().timeoutNetMReqSec, getNetManagementConfigs().retryNetMReqCount)
        message += resTimeout.message;
        setNetworkState(message.netstate);
        console.log(message);
        let logDate = setLogDate();
        const logFileName = 'logs/tls_cli_'+logDate+'.log';
        fs.appendFileSync(`${logFileName}`, message + '\n');
        message ='';
    });

    socket.on('close', () => {
        message += cli_handleClose();
        console.log(message);
        let logDate = setLogDate();
        const logFileName = 'logs/tls_cli_'+logDate+'.log';
        fs.appendFileSync(`${logFileName}`, message);
        message ='';
    });

    socket.on('error', (error) => {
        message += cli_handleError(error);
        console.log(message);
        let logDate = setLogDate();
        const logFileName = 'logs/tls_cli_'+logDate+'.log';
        fs.appendFileSync(`${logFileName}`, message);
        message ='';
    });
}

function logPayloadMessage(isopayloadRes){
    
    let netState = setNetworkState("Sign-On");
    let message = '';
    let MTI = getPayloadMTI(isopayloadRes);
    const dMTI = decodeMTI(MTI);
    let rnow = setDate();
    message += util.format('[%s] - INFO\t:\tMTI\t\t\t:\t[%s]\n', rnow, MTI);
    message += util.format('[%s] - INFO\t:\tConn. state\t\t:\t[%s]\n', rnow, netState);
    if (dMTI.errr===1) {
        message +=dMTI.msss;
        message += util.format('[%s] - FATAL\t:\tCannot continue - Error decoding MTI\n', rnow);
        message += util.format('[%s] - ***********************************************************************\n', rnow);
        console.log(message);
        let logDate = setLogDate();
        const logFileName = 'logs/tls_switch_'+logDate+'.log';
        fs.appendFileSync(`${logFileName}`, message);
        message ='';
    } else {
        message +=dMTI.msss;
        const m_protocol = getPayloadProtocol(isopayloadRes);
        const m_header = getPayloadHeader(isopayloadRes);
        const bitmap_hex = getPayloadBitmapHEX(isopayloadRes);
        message += util.format('[%s] - ***********************************************************************\n', rnow);
        message += util.format('[%s] - DATA\t:\tProtocol id.\t:\t[%s]\n', rnow, m_protocol);
        message += util.format('[%s] - DATA\t:\tMessage header\t:\t[%s]\n', rnow, m_header);
        message += util.format('[%s] - DATA\t:\tMessage MTI\t:\t[%s]\n', rnow, MTI);
        message += util.format('[%s] - DATA\t:\tBitmap HEX\t:\t[%s]\n', rnow, bitmap_hex.replace(/(.{2})/g, '$1 ').trim());
        message += util.format('[%s] - ***********************************************************************\n', rnow);
        message += util.format('[%s] - \tISO Message Fields Data elements :\n', rnow);
        let apiReq = payloadTojSON(isopayloadRes);
        message += logPayloadISO(apiReq);
        
    }
    return message;
}

function createNewSwitch(){

    const PORT = getswitchConfigs().sPort || 3000;
    const HOST = getswitchConfigs().sIP || '127.0.0.1';
    const options = {
        key: fs.readFileSync(getswitchConfigs().skey),
        cert: fs.readFileSync(getswitchConfigs().sCert),
        ca: [fs.readFileSync(getswitchConfigs().cCert)],
        host: getswitchConfigs().sIP || '127.0.0.1',
        port: getswitchConfigs().sPort || 3000,
        requestCert: getswitchConfigs().sReqCert,
        rejectUnauthorized: getswitchConfigs().sRejUnauth
    };
    let message = '';

    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
    }

    const server = tls.createServer(options,(socket) => {
        message += setNewSwitchLogs(socket);
        console.log(message);
        let logDate = setLogDate();
        const logFileName = 'logs/tls_switch_'+logDate+'.log';
        fs.appendFileSync(`${logFileName}`, message);
        message ='';

        socket.on('data', (data) => {
            let netState = getNetworkState();
            const isoPayloadRes = "0141ISO601000001814023000008A00000000000000000000012306012019111111230601201905110000000101012121212121280000000000";
            let rnow = setDate();
            const isoMsgReq = data.toString();
            const isoMsgReq_hexdump = Buffer.from(isoMsgReq, 'ascii');
            //message += util.format('\n[%s] - ***********************************************************************\n', rnow);
            message += util.format('[%s] - INFO\t:\tPayload data recieved\n', rnow);
            message += util.format('[%s] - ***********************************************************************\n', rnow);
            message += util.format('[%s] - \n', rnow);
            message += util.format('%s', hexdump(isoMsgReq_hexdump).replace(/^/gm, match => `[${rnow}] - \t`));
            message += util.format('\n[%s] - ***********************************************************************\n', rnow);
            const MTI = getPayloadMTI(isoMsgReq);
            const dMTI = decodeMTI(MTI);
            message += util.format('[%s] - INFO\t:\tMTI\t\t\t:\t[%s]\n', rnow, MTI);
            message += util.format('[%s] - INFO\t:\tConn. state\t\t:\t[%s]\n', rnow, netState);
            if (dMTI.errr===1) {
                message +=dMTI.msss;
                message += util.format('[%s] - FATAL\t:\tCannot continue - Error decoding MTI\n', rnow);
                message += util.format('[%s] - ***********************************************************************\n', rnow);
                message += util.format('[%s] - INFO\t:\tAwating data to send to server [...]\n', rnow);
                message += util.format('[%s] - ***********************************************************************\n', rnow);
                console.log(message);
                let logDate = setLogDate();
                const logFileName = 'logs/tls_switch_'+logDate+'.log';
                fs.appendFileSync(`${logFileName}`, message);
                message ='';
            } else {
                message +=dMTI.msss;
                const m_protocol = getPayloadProtocol(isoMsgReq);
                const m_header = getPayloadHeader(isoMsgReq);
                const bitmap_hex = getPayloadBitmapHEX(isoMsgReq);
                message += util.format('[%s] - ***********************************************************************\n', rnow);
                message += util.format('[%s] - DATA\t:\tProtocol id.\t:\t[%s]\n', rnow, m_protocol);
                message += util.format('[%s] - DATA\t:\tMessage header\t:\t[%s]\n', rnow, m_header);
                message += util.format('[%s] - DATA\t:\tMessage MTI\t:\t[%s]\n', rnow, MTI);
                message += util.format('[%s] - DATA\t:\tBitmap HEX\t:\t[%s]\n', rnow, bitmap_hex.replace(/(.{2})/g, '$1 ').trim());
                message += util.format('[%s] - ***********************************************************************\n', rnow);
                message += util.format('[%s] - \tISO Message Fields Data elements :\n', rnow);
                let apiReq = payloadTojSON(isoMsgReq);
                message += logPayloadISO(apiReq);
                message += util.format('[%s] - ***********************************************************************\n', rnow);
                message += util.format('[%s] - INFO\t:\tSending response to client\n', rnow);
                message += util.format('[%s] - ***********************************************************************\n', rnow);
                message += logPayloadMessage(isoPayloadRes);
                message += util.format('[%s] - ***********************************************************************\n', rnow);
                message += util.format('[%s] - INFO\t:\Response sent to client\n', rnow);
                message += util.format('[%s] - ***********************************************************************', rnow);
                socket.write(isoPayloadRes);
                console.log(message);
                let logDate = setLogDate();
                const logFileName = 'logs/tls_switch_'+logDate+'.log';
                fs.appendFileSync(`${logFileName}`, message + '\n');
                ms ='';
            }
        });
        
    });
    server.listen(PORT, HOST, () => {
    });
}



function createNewClientAPI(){
    const isoPayload = data.toString();
    const express = require('express');
    const bodyParser = require('body-parser');
    const app = express();
    app.use(bodyParser.json());

    app.post('/api/sendISO', (req, res) => {
    let netState = getNetworkState();
    if (req.body) {
        const apiReq = req.body;
        if (netState==="Sign-Off"){
        let snow = setDate();
        const validJsonISO = checkFormatIsoJson(apiReq);
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
        const validJsonISO = checkFormatIsoJson(apiReq);
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
}

function getPayloadMessageLength(payload){
    const mti = payload.substring(0,4);
    return mti;
}

function getPayloadProtocol(payload){
    const protocol_name = payload.substring(4,7);
    return protocol_name;
}

function getPayloadHeader(payload){
    const resHeader = payload.substring(7,15);
    return resHeader;
}

function getPayloadMTI(payload){
    const mti = payload.substring(15,19);
    return mti;
}

function getPayloadBitmapHEX(payload){
    const bitmapHEX = payload.substring(19,51);
    return bitmapHEX;
}

function getPayloadDE(payload){
    const payloadL = payload.length+1;
    const DE = payload.substring(51,payloadL);
    return DE;
}

function getPayloadDEFields(bitmapBIN) {
    const DEFields = [];
    for (let i = 0; i < bitmapBIN.length; i++) {
        if (bitmapBIN[i] === '1') {
            let fN = (i+1).toString().padStart(3,'0')
            DEFields.push(fN);
        }
    }
    return DEFields;
}

function payloadTojSON(payload){
    let specs = params.datafields;
    let jsonMessage = {};
    let bitmapBIN = hexToBinary(getPayloadBitmapHEX(payload));
    let payloadDE = getPayloadDE(payload);
    let payloadDEFields = getPayloadDEFields(bitmapBIN);
    for (const fN of payloadDEFields) {
      if (specs.hasOwnProperty(fN)) {
        let sp = 0;
        if (specs[fN].fixedLength) {
          let DEL = specs[fN].minLength;
          jsonMessage[fN] = payloadDE.substring(sp, DEL);
          let fp = payloadDE.length+1;
          sp = DEL; 
          payloadDE = payloadDE.substring(DEL,fp);
        } else {
          
          let DEL = payloadDE.substring(sp, 2);
          payloadDE = payloadDE.substring(2,payloadDE.length);
          let fp = payloadDE.length+1;
          jsonMessage[fN] = payloadDE.substring(sp, DEL);
          sp = DEL; 
          payloadDE = payloadDE.substring(DEL,fp);
        }
      }
    }
    return jsonMessage;
  }

module.exports.core = {
    isNumber, binaryToHex, hexToBinary, setNewCliLogs, cli_handleClose, cli_handleError, cli_handleConnect,
    setNewSwitchLogs, setDate, setLogDate, setNetworkState, getNetworkState, checkResponseTimeout,
    getcliConfigs, getswitchConfigs, getNetManagementConfigs, createNewClient, getPayloadMessageLength, getPayloadBitmapHEX,
    getPayloadDE, getPayloadDEFields, getPayloadHeader, getPayloadMTI, getPayloadProtocol, payloadTojSON, logPayloadISO,
    createNewSwitch, packDataElements
};