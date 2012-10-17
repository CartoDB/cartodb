
var _exec = require('child_process').exec;
var package_ = require('../package')

INCLUDE_DEPS = false;
if(process.argv.length >= 3) {
  INCLUDE_DEPS = process.argv[2] === 'include_deps'
}

require('../src/cartodb');

cdb.files.splice(0, 0, 'cartodb.js');
var files = cdb.files;

var c = 0;
cmds = [
  'rm -rf  dist/_cartodb.js',
  "echo // cartodb.js v" + package_.version + " >> dist/_cartodb.js",
  "echo // uncompressed version: cartodb.uncompressed.js >> dist/_cartodb.js",

  // loader
  //"echo // cartodb.js loader v" + package_.version + " > dist/loader.js",
  "cat vendor/head.load.min.js >> dist/loader.js",
  "cat src/loader.js >> dist/loader.js",

  // copy vendor
  "cp vendor/* dist/"


];

for(var i = 0; i < files.length; ++i) {
  var f = files[i];
  if(INCLUDE_DEPS || f.indexOf('vendor') === -1) {
    cmds.push('cat ./src/' + f + ' >> dist/_cartodb.js');
  }
}


//exec batch commands

function batch() {
  var cmd = cmds.shift();
  if(cmd !== undefined) {
    _exec(cmd, batch);
  }
}

batch();



