const isoPayloadRes = "0141ISO601000001814023000008A00000000000000000000012306012019111111230601201905110000000101012121212121280000000000";

const ISO_SPECS = require('./specs/gim-sid.json');

function getPayloadMessageLength(payload){
  const mti = payload.substring(0,4);
  return mti;
}

function hexToBinary(bitmap_hex) {
  const hexString = bitmap_hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16).toString(2).padStart(8, '0')).join('');
  const bitmap_bin = hexString.toUpperCase();
  return bitmap_bin;
}

function getPayloadDEFields(bitmapBIN) {
  let DEFields = [];
  for (let i = 0; i < bitmapBIN.length; i++) {
    if (bitmapBIN[i] === '1') {
      let fN = (i+1).toString().padStart(3,'0')
      DEFields.push(fN);
    }
  }
  return DEFields;
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

const m_l = getPayloadMessageLength(isoPayloadRes);
const p = getPayloadProtocol(isoPayloadRes);
const h = getPayloadHeader(isoPayloadRes);
const MTI = getPayloadMTI(isoPayloadRes);
const bH = getPayloadBitmapHEX(isoPayloadRes);
const DE = getPayloadDE(isoPayloadRes);
const jS = payloadTojSON(isoPayloadRes, ISO_SPECS);
const ooo = getPayloadDEFields('00000010001100000000000110000000100010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001');
console.log(m_l);
console.log(p);
console.log(h);
console.log(MTI);
console.log(bH);
console.log(hexToBinary(bH));
console.log(ooo);
console.log(DE);
console.log(jS);

/* const hexbitmap = '00000010001100000000000110000000100010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001';

function hexToBinary(bitmap_hex) {
  const hexString = bitmap_hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16).toString(2).padStart(8, '0')).join('');
  const bitmap_bin = hexString.toUpperCase();
  return bitmap_bin;
}

function binaryToHex(bitmap_bin) {
  const binaryString = bitmap_bin.match(/.{1,8}/g).map(byte => parseInt(byte, 2).toString(16).padStart(2, '0')).join('');
  const bitmap_hex = binaryString.toUpperCase();
  return bitmap_hex;
}
console.log(binaryToHex(hexbitmap));

 */