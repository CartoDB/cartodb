var _ = require('underscore');

var defaultOptions = {
  keepRunner: true,
  summary: true,
  display: 'short',
  vendor: [
    // Load & install the source-map-support lib (get proper stack traces from inlined source-maps)
    'node_modules/source-map-support/browser-source-map-support.js',
    'test/install-source-map-support.js',
    'http://maps.googleapis.com/maps/api/js?key=AIzaSyA4KzmztukvT7C49NSlzWkz75Xg3J_UyFI&v=3.32',
    'node_modules/jasmine-ajax/lib/mock-ajax.js',
    'node_modules/leaflet/dist/leaflet-src.js'
  ],
  helpers: 'test/helpers/SpecHelper.js'
};

/**
 * Jasmine grunt task for CARTO.js tests
 * https://github.com/gruntjs/grunt-contrib-jasmine#options
 * Load order: vendor, helpers, source, specs,
 */
module.exports = {
  'cartodb-src': {
    src: [], // actual src files are require'd in the *.spec.js files
    options: _.defaults({
      outfile: 'test/SpecRunner-src.html',
      specs: '<%= tmp %>/src-specs.js',
      '--web-security': 'no'
    }, defaultOptions)
  }
};
