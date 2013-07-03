
var package_ = require('../package')

if(process.argv.length >= 3) {
  if(process.argv[2] === 'version') {
    console.log(package_.version);
  } else if(process.argv[2] === 'sha') {
    require('git-rev').long(function (sha) {
      console.log(sha);
    })
  } else if(process.argv[2] === 'header') {
    require('git-rev').long(function (sha) {
      console.log("// version: " + package_.version);
      console.log("// sha: " + sha);
    })
  }
}
