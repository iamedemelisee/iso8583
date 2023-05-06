const util = require('util');
const emv = require('node-emv');
const _PARAMS = require('./params');
const MTI_SPECS = require('./specs/mti-specs.json');

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
      bitmap.length = _PARAMS.BITMAP_MAX_LENGTH;
    }
    else {
      bitmap.length = _PARAMS.BITMAP_MIN_LENGTH;
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

function getHeader() {
  const header = _PARAMS.INTERFACE + _PARAMS.PROTOCOL_VERSION + _PARAMS.FORMAT_INDICATOR;
  return header;
}

function packDataElements(jsonMessage){
  let data_elements = "";
  const ikeys = Object.keys(jsonMessage).sort((a, b) => a - b).slice(1);
    ikeys.forEach((key) => {
      data_elements += jsonMessage[key];
    });
  return data_elements;
};

function isNumber(str) {
  const regex = /^\d+$/;
  return regex.test(str);
}


function checkFormatIsoJson(jsonMessage, now) {
  let ms ='';
  let err = 0;
  if (!jsonMessage.hasOwnProperty("000")) {
    ms += util.format('[%s] - ERR : MTI not sent\n', now);
    err = 1;
  }
  else {
    const g_mti = jsonMessage["000"];
    if (isNumber(g_mti)) {
      let g_mti_length = g_mti.length;
      if (g_mti_length!=_PARAMS.MTI_LENGTH) {
        ms += util.format('[%s] - ERR : Incorrect MTI Length\n', now);
        err = 1;
      }
      else
      {
        ms += util.format('[%s] - INFO : Correct MTI Length\n', now);
      }
    }
    else {
      ms += util.format('[%s] - ERR : MTI not a number\n', now);
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
    ms += util.format('[%s] - INFO : ISO853 VERSION\t:\t[%s]\n', now, iv_value);
    if (mti_specs_iso_8583_message_class.includes(mti_iso_8583_message_class)) {
      const mc_value = MTI_SPECS["ISO_8583_MSG_CLASS"][mti_iso_8583_message_class]
      ms += util.format('[%s] - INFO : MESSAGE CLASS\t:\t[%s]\n', now, mc_value);
      if (mti_specs_iso_8583_message_func.includes(mti_iso_8583_message_func)) {
        const mf_value = MTI_SPECS["ISO_8583_MSG_FUNC"][mti_iso_8583_message_func];
        ms += util.format('[%s] - INFO : MESSAGE FUNCTION\t:\t[%s]\n', now, mf_value);
        if (mti_specs_iso_8583_message_org.includes(mti_iso_8583_message_org)) {
          const mo_value = MTI_SPECS["ISO_8583_MSG_ORG"][mti_iso_8583_message_org];
          ms += util.format('[%s] - INFO : MESSAGE ORIGIN\t:\t[%s]\n', now, mo_value);
        } else {
          ms += util.format('[%s] - ERR : Unknown message origin\n', now);
          err = 1;
        }
      } else {
        ms += util.format('[%s] - ERR : Unknown message function\n', now);
        err = 1;
      }
    } else {
      ms += util.format('[%s] - ERR : Unknown message class\n', now);
      err = 1;
    }
  } else {
    ms += util.format('[%s] - ERR : Unknown ISO8583 Version\n', now);
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


function logISO(jsonMessage, specs, now){
  let ms = "";
  const ikeys = Object.keys(jsonMessage).sort((a, b) => a - b).slice(1);
    ikeys.forEach((key) => {
      const value = jsonMessage[key];
      if (key == '055') {
        ms += util.format('[%s] - [F%s] : %s\n', now, key, '');
        emv.parse(value, function(data){
          if(data != null){
              data.forEach(element => {
                ms += util.format('[%s] -\t\t%s : %s\n', now, (element.tag).toString().padStart(4,' '), (element.value).toString().toUpperCase());
              });
          }
        });
      }
      else {
        for (const [fkey, fvalue] of Object.entries(specs)) {
          let flabel =''
          if (fkey == key) {
            if (fvalue.label) {
              flabel = fvalue.label;
            } else {
              flabel = 'NO DESC';
            }
            ms += util.format('[%s] - [F%s] [%s]: %s\n', now, key, flabel, value);
          }
        }
      }
    });
  return ms;
};

function initCLI_logs(socket, now){
  let ms = "";
  ms += util.format('[%s] - **************************************************************\n', now);
  ms += util.format('[%s] - INFO : INIT TLS Client [...]\n', now);
  ms += util.format('[%s] - INFO : Attempt to connect to server [...]\n', now);
  ms += util.format('[%s] - INFO : Connection Request Sent\n', now);
  ms += util.format('[%s] - INFO : Checking server certificate [...]\n', now);
  ms += util.format('[%s] - INFO : %s\n', now, socket.authorized ? 'Authorized server' : 'Unauthorized server');
  ms += util.format('[%s] - INFO : Connected successfully to TLS server\n', now);
  ms += util.format('[%s] - ***************************************\n', now);
  ms += util.format('[%s] - INFO : Awating data to send to server [...]\n', now);
  ms += util.format('[%s] - ***************************************\n', now);
  return ms;
};


module.exports = {
    packISO,
    unpackISO,
    logISO,
    initCLI_logs,
    generateBitmap,
    bitmapToHEX,
    getProtocol,
    getMTI,
    getHeader,
    packDataElements,
    checkFormatIsoJson,
    decodeMTI
};