
var _exec = require('child_process').exec;


//TODO: 
// - check the branch is empty
// - checkout gh-pages
// - push
// - create tag
// - check is working


// copy files to version
var package_ = require('../package')

var version = 'v' + package_.version.split('.')[0]

var full_version = version + '/' + package_.version
cmds = [
  'mkdir ' + version,
  'cp dist/* ' + version,
  'cp -r themes ' + version,
  'mkdir ' + version + '/' + package_.version,
  'cp dist/* ' + full_version,
  'cp -r themes ' + full_version
];

function batch() {
  var cmd = cmds.shift();
  if(cmd !== undefined) {
    console.log("***", cmd);
    _exec(cmd, batch);
  }
}

batch();
