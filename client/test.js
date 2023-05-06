const {decodeMTI} = require('./utils');
let now = new Date().toLocaleString();
const mti = "1210";

const mti_iso_8583_version = mti.substring(0,1);
const mti_iso_8583_message_class = mti.substring(1,2);
const mti_iso_8583_message_func = mti.substring(2,3);
const mti_iso_8583_message_org = mti.substring(3,4);
const rr = decodeMTI(mti, now);

console.log(rr);