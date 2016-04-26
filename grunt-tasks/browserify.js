module.exports = {
  src: {
    src: 'src/index_standalone.js',
    dest: '<%= config.dist %>/deep-insights.uncompressed.js',
    options: {
      watch: '<%= config.doWatchify %>',
      browserifyOptions: {
        debug: true, // to generate source-maps
        standalone: 'cartodb',
      },
      plugin: [
        ['browserify-resolutions', '*']
        // To be more specific we could use the following
        // ['browserify-resolutions', ['backbone']]
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
      plugin: [
        ['browserify-resolutions', '*']
        // To be more specific we could use the following
        // ['browserify-resolutions', ['backbone']]
      ]
    }
  }
}
