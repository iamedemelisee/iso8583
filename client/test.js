const isoPayloadRes = "0141ISO601000001814023000008A00000004242023123456230424120000110000000101000000000000080000000000";


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
  const bitmapHEX = payload.substring(19,35);
  return bitmapHEX;
}
const m_l = getPayloadMessageLength(isoPayloadRes);
const p = getPayloadProtocol(isoPayloadRes);
const h = getPayloadHeader(isoPayloadRes);
const MTI = getPayloadMTI(isoPayloadRes);
const bH = getPayloadBitmapHEX(isoPayloadRes);
console.log(m_l);
console.log(p);
console.log(h);
console.log(MTI);
console.log(bH);
