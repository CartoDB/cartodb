var _ = require('underscore');

var defaultOptions = {
  keepRunner: true,
  summary: true,
  display: 'short',
  vendor: [
    // Load & install the source-map-support lib (get proper stack traces from inlined source-maps)
    'node_modules/source-map-support/browser-source-map-support.js',
    'test/install-source-map-support.js'
  ]
};

/**
 * Jasmine grunt task for CartoDB.js tests
 * https://github.com/gruntjs/grunt-contrib-jasmine#options
 * Load order: vendor, helpers, source, specs,
 */
module.exports = {
  cartodb: {
    src: [
      'dist/cartodb.uncompressed.js'
    ],
    options: _.defaults({
      outfile: 'test/SpecRunner-cartodb.html',
      specs: '<%= config.tmp %>/cartodb-specs.js',
      vendor: defaultOptions.vendor
        .concat([
          'http://maps.googleapis.com/maps/api/js?sensor=false&v=3.12'
        ])
    }, defaultOptions)
  },
  'cartodb-src': {
    src: [], // actual src files are require'd in the *.spec.js files
    options: _.defaults({
      outfile: 'test/SpecRunner-src.html',
      specs: '<%= config.tmp %>/src-specs.js',
      vendor: defaultOptions.vendor
        .concat([
          'http://maps.googleapis.com/maps/api/js?sensor=false&v=3.12'
        ])
    }, defaultOptions)
  }
};
