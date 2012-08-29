
var _exec = require('child_process').exec;

INCLUDE_DEPS = false;

window = {};
require('../src/cartodb');

window.cdb.files.splice(0, 0, 'cartodb.js');
var files = window.cdb.files;

var c = 0;
_exec('rm -rf  dist/cartodb.js', function() {
  for(var i = 0; i < files.length; ++i) {
    var f = files[i];
    if(INCLUDE_DEPS || f.indexOf('vendor') === -1) {
      _exec('cat ./src/' + f + ' >> dist/cartodb.js', function () {
      });
    }
  }
});


