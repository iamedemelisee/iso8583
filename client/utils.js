const util = require('util');
const emv = require('node-emv');


function packISO(jsonMessage){
  const ikeys = Object.keys(jsonMessage);
  const ivalues= Object.values(jsonMessage);
  const mti = ivalues[0];
  const bitmap = ivalues[1];
  let isoPayloadReq = '';
  isoPayloadReq +=  mti + bitmap;
  try {
    for (let i = 2; i < ikeys.length; i++) {
      const currentKey = ikeys[i];
      const currentValue = jsonMessage[currentKey];
      const currentLength = (currentValue.toString()).length.toString().padStart(3, '0');
      isoPayloadReq += currentKey + currentLength +currentValue;
      }
    }
    catch(error) {
      isoPayloadReq = toString(error);
    }
    return isoPayloadReq;
};



function unpackISO(payloadMessage){
  const mti = payloadMessage.substr(0, 4);
  const bitmap = payloadMessage.substr(4, 16).toUpperCase();
  let fields = {};
  fields['000'] =mti;
  fields['001'] =bitmap;
  let index = 20;
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


function logISO(unpackedISO, specs, now){
  let ms = "";
  for (const [key, value] of Object.entries(unpackedISO.fields)) {
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
  }
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
    initCLI_logs
};