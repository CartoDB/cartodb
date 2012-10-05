
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
_exec('mkdir ' + version );
_exec('cp dist/* ' + version);
_exec('cp -r themes ' + version);
