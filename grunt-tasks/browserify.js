module.exports = {
  src: {
    src: 'index.js',
    dest: '<%= config.dist %>/deep-insights.js',
    options: {
      watch: '<%= config.doWatchify %>',
      browserifyOptions: {
        debug: true, // to generate source-maps
        standalone: 'cartodb.deepInsights'
      }
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
      }
    }
  }
}
