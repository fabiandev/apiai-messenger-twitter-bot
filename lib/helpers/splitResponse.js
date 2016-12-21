const chunkString = require('./chunkString');

function splitResponse(str) {
  if (str.length <= 320) {
    return [str];
  }

  return chunkString(str, 300);
}

module.exports = splitResponse;
