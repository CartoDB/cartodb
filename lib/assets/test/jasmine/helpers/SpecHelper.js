var Polyglot = require('node-polyglot');

// As setup in entry points
var polyglot = new Polyglot({
  locale: 'en',
  phrases: {}
});
global._t = polyglot.t.bind(polyglot);
