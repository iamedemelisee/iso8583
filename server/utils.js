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


function logISO(unpackedISO, specs){
  let ms = "";
  let now = new Date().toLocaleString();
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

function initSRV_logs(socket){
  let ms = "";
  let now = new Date().toLocaleString();
  ms += util.format('*****************************************************************************\n');
  ms += util.format('[%s] - INFO : Init TLS Server [...]\n', now);
  ms += util.format('[%s] - INFO : Awaiting client connection [...]\n', now);
  ms += util.format('[%s] - INFO : Connection Request Recieved\n', now);
  ms += util.format('[%s] - INFO : Checking client infos [...]\n', now);
  
  const address = socket.remoteAddress;
  const port = socket.remotePort;
  const addressString = address.toString();
  const portString = port.toString();
  if (addressString.length>0 && portString>0)
  {
    ms += util.format('[%s] - INFO : OK ==> %s:%s \n', now, addressString, portString);
  }
  else {
    ms += util.format('[%s] - INFO : Unkown client\n', now);
  }
  ms += util.format('[%s] - INFO : Checking certificate [...]\n', now);
  ms += util.format('[%s] - INFO : %s\n', now, socket.authorized ? 'Authorized client' : 'Unauthorized client');
  ms += util.format('[%s] - INFO : New client successfully connected :\n', now);
  ms += util.format('[%s] - INFO : Awaiting client to send data [...]\n', now);
  return ms;
};


module.exports = {
    packISO,
    unpackISO,
    logISO,
    initSRV_logs
};