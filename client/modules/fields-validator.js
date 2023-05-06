const _PARAMS = require('./params');

function decodeMTI(mti) {
    let iso_8583_version = mti.substring(0,1);
    return iso_8583_version;
}

function xx()