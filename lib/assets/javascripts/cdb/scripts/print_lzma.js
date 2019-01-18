/*
 * this utility decompress layergroup lzma
 * usage:
 *  node print_lzma.js lzma_param
 */

var LZMA       = require('../vendor/lzma').LZMA

var str = decodeURIComponent(process.argv[2]);


// Decode (from base64)
var lzma = (new Buffer(str, 'base64').toString('binary')).split('').map(function(c) { return c.charCodeAt(0) - 128 })

// Decompress
LZMA.decompress(
  lzma,
  function(result) {
    console.log(result);
  }
);
