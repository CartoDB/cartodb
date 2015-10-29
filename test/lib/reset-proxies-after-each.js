var createProxy = require('../../src-browserify/require-proxies/create-require-proxy');

afterEach(function() {
  createProxy.__reset();
});
