var vendorDependencies = ['cartodb.js'];

module.exports = {
  vendor: {
    src: vendorDependencies.map(require.resolve),
    dest: '<%= config.tmp %>/vendor.js',
    options: {
      require: vendorDependencies.map(function(vendor) {
        return [require.resolve(vendor), { expose: vendor }];
      }),
      plugin: [
        ['browserify-resolutions', vendorDependencies]
      ]
    }
  },

  src: {
    src: 'src/index_standalone.js',
    dest: '<%= config.dist %>/deep-insights.uncompressed.js',
    options: {
      watch: '<%= config.doWatchify %>',
      browserifyOptions: {
        debug: true, // to generate source-maps
        standalone: 'cartodb'
      },
      plugin: [
        ['browserify-resolutions', ['backbone', 'cartodb.js', 'd3', 'jquery', 'moment', 'perfect-scrollbar', 'urijs', 'underscore']]
      ]
    }
  },

  specs: {
    src: [
      'spec/fail-tests-if-have-errors-in-src.js',
      'spec/**/*.js'
    ],
    dest: '<%= config.tmp %>/specs.js',
    options: {
      watch: '<%= config.doWatchify %>',
      browserifyOptions: {
        debug: true, // to generate source-maps
      },
      external: vendorDependencies,
      plugin: [
        ['browserify-resolutions', vendorDependencies]
      ]
    }
  }
}
