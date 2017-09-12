var _ = require('underscore');
var fs = require('fs');

// basically the same as what browserify jstfy transform does 
// TODO: require.extensions is deprecated. We should use webpack with underscore-template-loader to load .tpl files
// eslint-disable-next-line
require.extensions['.tpl'] = function (module, filename) {
  return _.template(fs.readFileSync(filename, 'utf8'));
};
