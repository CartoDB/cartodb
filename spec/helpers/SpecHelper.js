var _ = require('underscore');
var fs = require('fs');

// basically the same as what browserify jstfy transform does
require.extensions['.tpl'] = function (module, filename) {
  return _.template(fs.readFileSync(filename, 'utf8'));
};
