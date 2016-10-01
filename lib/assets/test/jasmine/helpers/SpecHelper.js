var _ = require('underscore');
var fs = require('fs');
var Polyglot = require('node-polyglot');

// As setup in entry points
var polyglot = new Polyglot({
  locale: 'en',
  phrases: {}
});
global._t = polyglot.t.bind(polyglot);

// basically the same as what browserify jstfy transform does
require.extensions['.tpl'] = function (module, filename) {
  return _.template(fs.readFileSync(filename, 'utf8'));
};
