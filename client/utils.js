const util = require('util');
const fs = require('fs');
const emv = require('node-emv');
const _PARAMS = require('./params');
const MTI_SPECS = require('./specs/mti-specs.json');
const ISO_SPECS = require('./specs/gim-sid.json');
const hexdump = require('hexdump-nodejs');
let retryCount = 0;


function binaryToHex(bitmap_bin) {
  const binaryString = bitmap_bin.match(/.{1,8}/g).map(byte => parseInt(byte, 2).toString(16).padStart(2, '0')).join('');
  const bitmap_hex = binaryString.toUpperCase();
  return bitmap_hex;
}

function hexToBinary(bitmap_hex) {
  const hexString = bitmap_hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16).toString(2).padStart(8, '0')).join('');
  const bitmap_bin = hexString.toUpperCase();
  return bitmap_bin;
}

function getNetworkState(){
  return _PARAMS.CONN_STATE;
}

function setNetworkState(networkState){
  _PARAMS.CONN_STATE = networkState;
  return _PARAMS.CONN_STATE;
}

function setDate()
{
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

function setLogDate()
{
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

const crypto = require('crypto');

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

function set_DE007()
{
  const now = new Date();
  const YY = now.getFullYear().toString().substring(2,4);
  const MM = (now.getMonth() + 1).toString().padStart(2,'0'); 
  const dd = now.getDate().toString().padStart(2,'0');
  const HH = now.getHours().toString().padStart(2,'0');
  const mm = now.getMinutes().toString().padStart(2,'0');

  const dateFormatted = YY+MM+dd+HH+mm;

  return dateFormatted;
}

function set_DE033(){
  return "00000001010";
}

function generateNetworkMessage(DE_024) {
  const apiReq = {
    "000": "1804",
    "007": set_DE007(),
    "011": set_DE011(),
    "012": set_DE007(),
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

function initCLI_logs(socket, now){
  let ms = "";
  ms += util.format('[%s] - **********************************************************************************************************************\n', now);
  ms += util.format('[%s] - INFO\t:\tTLS Client initialization\t[...]\n', now);
  ms += util.format('[%s] - INFO\t:\tAttempt to connect to server\t[...]\n', now);
  ms += util.format('[%s] - INFO\t:\tConnection Request Sent\n', now);
  return ms;
};

function generateBitmap(jsonMessage) {
  const bitmap = Array(_PARAMS.BITMAP_MAX_LENGTH).fill('0');
  for (const field in jsonMessage) {
    const fieldNumber = parseInt(field);
    if (fieldNumber <= _PARAMS.BITMAP_MAX_LENGTH) {
      bitmap[fieldNumber - 1] = '1';
    } else {
      throw new Error(`Le numéro de champ ${fieldNumber} dépasse le nombre maximum de bits dans le Bitmap ${_PARAMS.BITMAP_MAX_LENGTH}`);
    }
    let fieldsPresent = false;
    for (let i = 65; i < _PARAMS.BITMAP_MAX_LENGTH; i++) {
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


function getProtocol() {
  return _PARAMS.PROTOCOL_NAME;
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
  const header = _PARAMS.INTERFACE + _PARAMS.PROTOCOL_VERSION + _PARAMS.FORMAT_INDICATOR;
  return header;
}

function checkIsoFields(field) {
  let err = 1;
  let maxLength = 0;
  let minLength = 0;
  if (ISO_SPECS.hasOwnProperty(field)) {
      const fixedLength = ISO_SPECS[field].fixedLength;
      err = fixedLength ? 0 : 1;
      if (fixedLength) {
        maxLength = ISO_SPECS[field].maxLength;
        minLength = maxLength;
        err = 0;
      } else {
        maxLength = ISO_SPECS[field].maxLength;
        minLength = ISO_SPECS[field].minLength;
        err = 1;
      }
    }
  return {errr: err, min_Length: minLength, max_Length: maxLength };
}

function packDataElements(jsonMessage){
  let data_elements = "";
    let err = 1;
    const ikeys = Object.keys(jsonMessage).sort((a, b) => a - b).slice(1);
      ikeys.forEach((key) => {
        let fixedL = checkIsoFields(key).errr;
        let minL = checkIsoFields(key).min_Length;
        let maxL = checkIsoFields(key).max_Length;
        let fLength = jsonMessage[key].toString().length;
        let sfLength ='';
        if (fixedL===1) {
          if (fLength>=minL && fLength <= maxL) {
            sfLength = fLength.toString().padStart(2, '0');
            err = 0;
          }
        } else {
          if (fLength===minL && fLength === maxL) {
            sfLength = '';
            err = 0;
          }
        }
        data_elements += sfLength + jsonMessage[key];
      });
    return {errr: err, dataElements: data_elements};
};

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

function payloadTojSON(payload, specs){
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

function unpackPayloadDataElements(payload){
  let data_elements = "";
    let err = 1;
    const ikeys = Object.keys(jsonMessage).sort((a, b) => a - b).slice(1);
      ikeys.forEach((key) => {
        let fixedL = checkIsoFields(key).errr;
        let minL = checkIsoFields(key).min_Length;
        let maxL = checkIsoFields(key).max_Length;
        let fLength = jsonMessage[key].toString().length;
        let sfLength ='';
        if (fixedL===1) {
          if (fLength>=minL && fLength <= maxL) {
            sfLength = fLength.toString().padStart(2, '0');
            err = 0;
          }
        } else {
          if (fLength===minL && fLength === maxL) {
            sfLength = '';
            err = 0;
          }
        }
        data_elements += sfLength + jsonMessage[key];
      });
    return {errr: err, dataElements: data_elements};
};

function isNumber(str) {
  const regex = /^\d+$/;
  return regex.test(str);
}


function checkFormatIsoJson(jsonMessage, now) {
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
      if (g_mti_length!=_PARAMS.MTI_LENGTH) {
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



function decodeMTI(mti, now){
  let ms ='';
  let err = 0;

  const mti_iso_8583_version = mti.substring(0,1);
  const mti_iso_8583_message_class = mti.substring(1,2);
  const mti_iso_8583_message_func = mti.substring(2,3);
  const mti_iso_8583_message_org = mti.substring(3,4);

  const mti_specs_iso_8583_version = Object.keys(MTI_SPECS["ISO_8583_VERSION"]);
  const mti_specs_iso_8583_message_class = Object.keys(MTI_SPECS["ISO_8583_MSG_CLASS"]);
  const mti_specs_iso_8583_message_func = Object.keys( MTI_SPECS["ISO_8583_MSG_FUNC"]);
  const mti_specs_iso_8583_message_org = Object.keys(MTI_SPECS["ISO_8583_MSG_ORG"]);

  if (mti_specs_iso_8583_version.includes(mti_iso_8583_version)) {
    const iv_value = MTI_SPECS["ISO_8583_VERSION"][mti_iso_8583_version];
    ms += util.format('[%s] - INFO\t:\tISO853 VERSION\t:\t[%s]\n', now, iv_value);
    if (mti_specs_iso_8583_message_class.includes(mti_iso_8583_message_class)) {
      const mc_value = MTI_SPECS["ISO_8583_MSG_CLASS"][mti_iso_8583_message_class];
      ms += util.format('[%s] - INFO\t:\tMESSAGE CLASS\t:\t[%s]\n', now, mc_value);
      if (mti_specs_iso_8583_message_func.includes(mti_iso_8583_message_func)) {
        const mf_value = MTI_SPECS["ISO_8583_MSG_FUNC"][mti_iso_8583_message_func];
        ms += util.format('[%s] - INFO\t:\tMESSAGE FUNC.\t:\t[%s]\n', now, mf_value);
        if (mti_specs_iso_8583_message_org.includes(mti_iso_8583_message_org)) {
          const mo_value = MTI_SPECS["ISO_8583_MSG_ORG"][mti_iso_8583_message_org];
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



function packISO(jsonMessage){
  let isoPayloadReq = '';
  const ikeys = Object.keys(jsonMessage).sort((a, b) => a - b);
    ikeys.forEach((currentKey) => {
      const currentValue = jsonMessage[currentKey];
      const currentLength = (currentValue.toString()).length.toString().padStart(3, '0');
      isoPayloadReq += currentKey + currentLength + currentValue;
    });
    isoPayloadReq = isoPayloadReq.substring(6);
    return isoPayloadReq;
};



function unpackISO(payloadMessage){
  const mti = payloadMessage.substr(0, 4);
  let fields = {};
  fields['000'] = mti;
  let index = 4;
  try {
    while (index < payloadMessage.length) {
      const field = payloadMessage.substr(index, 3);
      const fieldLength = parseInt(payloadMessage.substr(index + 3, 3));
      const fieldValue = payloadMessage.substr(index + 6, fieldLength);
      fields[field] = fieldValue;
      index += 6 + fieldLength;
    }
  } catch (error) {
    fields[0] = toString(error);
  }
  return {fields};
};

function padRight(string, length, paddingChar) {
  const paddingLength = Math.max(0, length - string.length);
  return string + paddingChar.repeat(paddingLength);
}

function logISO(jsonMessage, specs, now){
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
};














function logPayloadISO(jsonMessage, specs, now){
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
  const res_sendNetworkMessage = formatNetworkMessage(apiReq,inow,ISO_SPECS);
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
  //counter--;
  let inow = setDate();
  let netState = setNetworkState("Sign-Off");
  let ms = '';
  let responseReceived = false;
  //ms += sendNetworkMessage(socket);
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
        const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
        fs.appendFileSync(`${logFileName}`, ms + '\n');
        ms = '';
      } else {
        netState = setNetworkState("Sign-Off");
        ms += util.format('\n[%s] - *************************************************************************************************\n', inow);
        ms += util.format('[%s] - WARN\t:\tConn. set to Sign-Off. No reponse from server to network message request\n', inow);
        ms += util.format('[%s] - *************************************************************************************************', inow);
        console.log(ms);
        let logDate = setLogDate();
        const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
        fs.appendFileSync(`${logFileName}`, ms + '\n');
        ms = '';
      }
    }
  }
  setTimeout(sendNetworkMessageWithTimeout, timeout);
  

  socket.on('data', (data) => {
    responseReceived = true;
    let netState = setNetworkState("Sign-On");
    let inow = setDate();
    let ms = '';
    const isoPayload = data.toString();
    let conn_st = getNetworkState();
    const MTI = getPayloadMTI(isoPayload);
    const dMTI = decodeMTI(MTI, inow);
    ms += util.format('[%s] - INFO\t:\tMTI \t\t:\t[%s]\n', inow, MTI);
    ms += util.format('[%s] - INFO\t:\tConn. state\t:\t[%s]\n', inow, conn_st);
    if (dMTI.errr===1) {
      ms +=dMTI.msss;
      ms += util.format('[%s] - FATAL\t:\tCannot continue - Error decoding MTI\n', inow);
      ms += util.format('[%s] - ***********************************************************************\n', inow);
      ms += util.format('[%s] - INFO\t:\tAwating data to send to server [...]\n', inow);
      ms += util.format('[%s] - ***********************************************************************\n', inow);
      console.log(ms);
      let logDate = setLogDate();
      const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
      fs.appendFileSync(`${logFileName}`, ms + '\n');
      ms ='';
    } else {
      ms +=dMTI.msss;
      const m_protocol = getPayloadProtocol(isoPayload);
      const m_header = getPayloadHeader(isoPayload);
      const bitmap_hex = getPayloadBitmapHEX(isoPayload);
    
          ms += util.format('[%s] - ***********************************************************************\n', inow);
          ms += util.format('[%s] - DATA\t:\tProtocol id.\t:\t[%s]\n', inow, m_protocol);
          ms += util.format('[%s] - DATA\t:\tMessage header\t:\t[%s]\n', inow, m_header);
          ms += util.format('[%s] - DATA\t:\tMessage MTI\t:\t[%s]\n', inow, MTI);
          ms += util.format('[%s] - DATA\t:\tBitmap HEX\t:\t[%s]\n', inow, bitmap_hex.replace(/(.{2})/g, '$1 ').trim());
          ms += util.format('[%s] - ***********************************************************************\n', inow);
          ms += util.format('[%s] - \tISO Message Fields Data elements :\n', inow);
          let apiReq = payloadTojSON(isoPayload, ISO_SPECS);
          ms += logPayloadISO(apiReq, ISO_SPECS, inow);
          ms += util.format('[%s] - ***********************************************************************\n', inow);
          ms += util.format('[%s] - INFO\t:\tPayload recieved\n', inow);
          ms += util.format('[%s] - ***********************************************************************\n', inow);
          const isoPayloadReq_hexdump = Buffer.from(isoPayload, 'ascii');
          ms += util.format('%s', hexdump(isoPayloadReq_hexdump).replace(/^/gm, match => `[${inow}] - \t`));
          ms += util.format('\n[%s] - ***********************************************************************\n', inow);
          ms += util.format('[%s] - INFO\t:\tAwating data to send to server\n', inow);
          ms += util.format('[%s] - ***********************************************************************\n', inow);
          console.log(ms);
          let logDate = setLogDate();
          const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
          fs.appendFileSync(`${logFileName}`, ms + '\n');
          ms ='';
          /* const checkpackedDataElements = packDataElements(apiReq).errr;
          const packedDataElements = packDataElements(apiReq).dataElements;
          if (checkpackedDataElements===1) {
            ms += util.format('[%s] - ERROR\t:\tPackaging to ISO payload failed\n', snow);
            console.log(ms);
            let logDate = setLogDate();
            const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
            fs.appendFileSync(`${logFileName}`, ms + '\n');
            ms ='';
          } else {
            const m_length = m_protocol.length + m_header.length + 4 + 64 + packedDataElements.length;
            isoPayloadReq += m_length.toString().padStart(4,'0') + m_protocol + m_header + MTI + bitmap_hex + packedDataElements;
            const isoPayloadReq_hexdump = Buffer.from(isoPayloadReq, 'ascii');
            ms += util.format('%s', hexdump(isoPayloadReq_hexdump).replace(/^/gm, match => `[${snow}] - \t`));
            ms += util.format('\n[%s] - INFO\tRequest sent to server\n', snow);
            socket.write(isoPayloadReq);
            ms += util.format('[%s] - ***********************************************************************\n', snow);
            ms += util.format('[%s] - INFO\t:\tAwating response from server [...]\n', snow);
            ms += util.format('[%s] - ***********************************************************************\n', snow);
            console.log(ms);
            let logDate = setLogDate();
            const logFileName = 'logs/tls_cli_log_'+logDate+'.log';
            fs.appendFileSync(`${logFileName}`, ms + '\n');
            ms ='';
          } */
          
        }

  });
  return {netstate : netState, message : ms};
}







function formatNetworkMessage(apiReq, now, isoDefaultSpecs){
  let err = 1;
  let message ='';
  let isoPayloadReq = '';
  let conn_st = getNetworkState();
  const validJsonISO = checkFormatIsoJson(apiReq, now);
  const netMTI = getMTI(apiReq);
  message += util.format('[%s] - INFO\t:\tMTI \t\t:\t[%s]\n', now, netMTI);
  message += util.format('[%s] - INFO\t:\tConn. state\t:\t[%s]\n', now, conn_st);
  if (validJsonISO.errr===1) {
    message +=validJsonISO.msss;
    message += util.format('[%s] - FATAL\t:\tCannot continue - Invalid MTI \n', now);
    message += util.format('[%s] - ***********************************************************************\n', now);
    message += util.format('[%s] - INFO\t:\tAwating data to send to server [...]\n', now);
    message += util.format('[%s] - ***********************************************************************\n', now);
  }
  else {
    const MTI = getMTI(apiReq);
    const dMTI = decodeMTI(MTI, now);
    if (dMTI.errr===1) {
      message +=dMTI.msss;
      message += util.format('[%s] - FATAL\t:\tCannot continue - Error decoding MTI\n', now);
      message += util.format('[%s] - ***********************************************************************\n', now);
      message += util.format('[%s] - INFO\t:\tAwating data to send to server [...]\n', now);
      message += util.format('[%s] - ***********************************************************************\n', now);
    }
    else {
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
      message += logISO(apiReq,isoDefaultSpecs, now);
      message += util.format('[%s] - ***********************************************************************\n', now);

      message += util.format('[%s] - INFO\t:\tPackaging to ISO payload\t[...]\n', now);
      const checkpackedDataElements = packDataElements(apiReq).errr;
      const packedDataElements = packDataElements(apiReq).dataElements;
      if (checkpackedDataElements===1) {
        message += util.format('[%s] - ERROR\t:\tPackaging to ISO payload failed\n', now);
      } else {
        const m_length = m_protocol.length + m_header.length + 4 + 64 + packedDataElements.length;
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


function sendRequestToServer() {
  if (retryCount >= 3) {
    // Dépassé le nombre maximum de tentatives
    return;
  }

  if (res_sendNetworkMessage.err === 0) {
    const now = new Date().toISOString();
    message += util.format('[%s] - INFO\t:\tRequest sent to server\n', now);
    socket.write(res_sendNetworkMessage.isoPayload);
    message += util.format('[%s] - ***********************************************************************\n', now);
    message += util.format('[%s] - INFO\t:\tAwaiting response from server [...]\n', now);
    message += util.format('[%s] - ***********************************************************************', now);
    
    // Vérifier la réponse du serveur après 5 secondes
    setTimeout(checkServerResponse, 5000);
  } else {
    const now = new Date().toISOString();
    message += util.format('[%s] - INFO\t:\tRequest failed to send to server\n', now);
  }
}

function checkServerResponse() {
  if (CONN_STATE === "Sign-On") {
    // Le serveur a répondu, terminer le processus
    return;
  }

  // Le serveur n'a pas répondu, réessayer
  retryCount++;

  if (retryCount < 3) {
    sendRequestToServer();
  } else {
    // Dépassé le nombre maximum de tentatives
    return;
  }
}

module.exports = {
    packISO,
    unpackISO,
    logISO,
    isNumber,
    initCLI_logs,
    generateBitmap,
    bitmapToHEX,
    getProtocol,
    getMTI,
    getHeader,
    packDataElements,
    checkFormatIsoJson,
    decodeMTI,setDate, setLogDate, setNetworkState, checkIsoFields, getNetworkState, generateNetworkMessage,
    formatNetworkMessage, sendNetworkMessage, checkResponseTimeout
};