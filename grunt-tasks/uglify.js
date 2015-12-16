var _ = require('underscore');
var browserify = require('./browserify');

var cfg = {};

var defaultOptions = {
  sourceMap: true
};

for (var name in browserify) {
  if (!/specs/.test(name)) {
    var src = browserify[name].dest;
    var uglifiedDest = src.replace('.uncompressed', '');

    var files = {};
    files[uglifiedDest] = src;

    cfg[name] = {
      options: _.extend({
        sourceMapIn: src.replace('.js', '.map')
      }, defaultOptions),
      files: files
    };
  }
}

module.exports = cfg;
