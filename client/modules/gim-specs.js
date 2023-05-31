const ISO_SPECS = require('./specs/gim-sid.json');

function isNumber(str) {
    const regex = /^\d+$/;
    return regex.test(str);
}

function fieldProperties(field) {
    let isFixedLength = true;
    let maxLength = 0;
    let minLength = 0;
    if (ISO_SPECS.hasOwnProperty(field)) {
        const fixedLength = ISO_SPECS[field].fixedLength;
        isFixedLength = fixedLength ? true : false;
        if (fixedLength) {
          maxLength = ISO_SPECS[field].maxLength;
          minLength = maxLength;
          isFixedLength = true;
        } else {
          maxLength = ISO_SPECS[field].maxLength;
          minLength = ISO_SPECS[field].minLength;
          isFixedLength = false;
        }
      }
    return {is_Fixed_Length: isFixedLength, min_Length: minLength, max_Length: maxLength };
}
 
function checkF002(field, fContent) {
    let err = 1;
    if (field==="003") {
        const cfContent = isNumber(fContent);
        if (cfContent) {
            const fContentL = fContent.toString().length;
            const fProperties = fieldProperties;
            if (fProperties.is_Fixed_Length) {
                const fLength = fProperties.max_Length;
            }
        }
    }
}