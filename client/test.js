let now = new Date();
let formattedDate = `${now.toLocaleString()}.${now.getMilliseconds().toString().padStart(3, '0')}`;
console.log(formattedDate);