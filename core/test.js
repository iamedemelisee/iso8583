const {core} = require('./modules/utils');
const isop = "0141ISO6010000018040230018088000000000000000000000123060321481111112222222222223334444110000000001055555555555500000000"
let apiReq = core.payloadTojSON(isop);
let ss = core.packDataElements(apiReq);

console.log(apiReq);
console.log(ss);