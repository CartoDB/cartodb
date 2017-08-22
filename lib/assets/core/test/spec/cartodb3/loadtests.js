// var testsContext = require.context('./', true, /\.js$/);
// testsContext.keys().forEach(testsContext);

var __karmaWebpackManifest__ = [];
require('./SpecHelper');

var testsContext = require.context('./', true, /\.js$/);

function inManifest (path) {
  return __karmaWebpackManifest__.indexOf(path) >= 0;
}

var runnable = testsContext.keys().filter(inManifest);
if (!runnable.length) {
  runnable = testsContext.keys();
}

runnable.forEach(testsContext);
