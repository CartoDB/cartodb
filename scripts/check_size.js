/*
 * this utility reports the size of a layergroup compressed
 * usage:
 *  node check_size.js layergroup.json
 */

var lzma = require("lzma").LZMA();
var fs = require('fs');
function _array2hex (byteArr) {
  var encoded = [];
  for(var i = 0; i < byteArr.length; ++i) {
    encoded.push(String.fromCharCode(byteArr[i] + 128));
  }
  buffer = new Buffer(encoded.join(''), 'binary');
  return buffer.toString('base64');
}

var str = fs.readFileSync(process.argv[2]);
lzma.compress(str, 1, function(result) {
  console.log("size (raw/compressed/base64 compressed): ", str.length, "/", result.length, "/", _array2hex(result).length);
});



