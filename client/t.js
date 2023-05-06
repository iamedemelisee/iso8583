var hexdump = require('hexdump-nodejs');
//let data = '49534F373031303030303031383134823000008A00000000000000000000013139303231333232353239313731373931393032313332323532353030363330303332303930343432323931373137393830303030303030303030';
/* let vdump ='';
for (let i = 0; i < data.length; i += 2) {
  vdump += '\\x' + data.slice(i, i + 2);
}
let dump = new Uint8Array(vdump);
//const binary_data = Buffer.from(vdump, 'ascii');
const buf1 = Buffer(dump, 'ascii');
console.log(hexdump(buf1)); */
let data = '\x49\x53\x4F\x37\x30\x31\x30\x30\x30\x30\x30\x31\x38\x31\x34\x82\x30\x00\x00\x8A\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x31\x39\x30\x32\x31\x33\x32\x32\x35\x32\x39\x31\x37\x31\x37\x39\x31\x39\x30\x32\x31\x33\x32\x32\x35\x32\x35\x30\x30\x36\x33\x30\x30\x33\x32\x30\x39\x30\x34\x34\x32\x32\x39\x31\x37\x31\x37\x39\x38\x30\x30\x30\x30\x30\x30\x30\x30\x30\x30';
const binary_data = Buffer(data, 'ascii');
console.log(hexdump(binary_data));

/* function hexStringToByteArray(hexString) {
  var result = [];
  for (var i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16));
  }
  return result;
}

var hexString = "49534F";
var byteArray = hexStringToByteArray(hexString);
console.log(byteArray); // [0x49, 0x53, 0x4F] */

/* function hexToByteArray(hexString) {
  const byteArray = [];
  for (let i = 0; i < hexString.length; i += 2) {
    byteArray.push(parseInt(hexString.substr(i, 2), 16));
  }
  return new Uint8Array(byteArray);
}
 */