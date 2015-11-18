var _ = require('underscore');

var defaultOptions = {
  keepRunner: true,
  summary: true,
  display: 'short',
  vendor: [
    // Load & install the source-map-support lib (get proper stack traces from inlined source-maps)
    "node_modules/source-map-support/browser-source-map-support.js",
    "test/install-source-map-support.js",
  ]
};

/**
 * Jasmine grunt task for CartoDB.js tests
 * https://github.com/gruntjs/grunt-contrib-jasmine#options
 * Load order: vendor, helpers, source, specs,
 */
module.exports = {
  task: function() {
    return {

      'src': {
        src: [], // actual src files are require'd in the *.spec.js files
        options: _.defaults({
          outfile: 'test/SpecRunner-src.html',
          specs: '<%= config.tmp %>/src-specs.js',
          vendor: defaultOptions.vendor.concat([
            'http://maps.googleapis.com/maps/api/js?sensor=false&v=3.12',

            // this is required by vis/vis spec "should load modules";
            // TODO: core/loader searches existing <script> tags for some src that contains *cartodb*.js* file,
            // it uses the same URL path to load the module from - could we make this more robust and not depend on
            // distant external/global circumstances to define its behavior, e.g. a configuration when model is created?
            "vendor/fake.cartodb.js",
          ]),
        }, defaultOptions)
      },

      torque: {
        src: [
          'dist/cartodb.mod.torque.uncompressed.js',
        ],
        options: _.defaults({
          outfile: 'test/SpecRunner-torque.html',
          specs: '<%= config.tmp %>/torque-specs.js',
          vendor: defaultOptions.vendor.concat([
            'http://maps.googleapis.com/maps/api/js?sensor=false&v=3.12',
            'dist/cartodb.uncompressed.js',

            // this is required by vis/vis spec "should load modules";
            // TODO: core/loader searches existing <script> tags for some src that contains *cartodb*.js* file,
            // it uses the same URL path to load the module from - could we make this more robust and not depend on
            // distant external/global circumstances to define its behavior, e.g. a configuration when model is created?
            "vendor/fake.cartodb.js",
          ]),
        }, defaultOptions)
      },

      odyssey: {
        src: [
          'dist/cartodb.mod.odyssey.uncompressed.js',
        ],
        options: _.defaults({
          outfile: 'test/SpecRunner-odyssey.html',
          specs: '<%= config.tmp %>/odyssey-specs.js',
          vendor: defaultOptions.vendor.concat([
            '<%= config.dist %>/cartodb.uncompressed.js',
          ]),
        }, defaultOptions),
      },

      cartodb: {
        src: [
          'dist/cartodb.uncompressed.js',
        ],
        options: _.defaults({
          outfile: 'test/SpecRunner-cartodb.html',
          specs: '<%= config.tmp %>/cartodb-specs.js',
        }, defaultOptions)
      },

    }
  }
}
