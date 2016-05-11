/**
 * See https://github.com/evanw/node-source-map-support#browser-support
 * This is expected to be included in a browserify-module to give proper stack traces, based on browserify's source maps.
 */
if (window.location.search.indexOf('disablesourcemaps') === -1) {
  require('source-map-support').install();
}
