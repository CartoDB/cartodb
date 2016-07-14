/**
 *  Watch grunt task for CartoDB.js
 *
 */
module.exports = {
  task: function () {
    return {
      jasmine: {
        files: [
          'src/**/*.js',
          'spec/**/*.js'
        ],
        tasks: ['npm-test'],
        options: {
          spawn: true, // don't share context with others watchers, only want to rerun the jasmine tests separately
          interrupt: true,
          atBegin: false
        }
      },
      scss: {
        files: ['themes/scss/**/*.scss'],
        tasks: ['sass', 'concat:themes', 'cssmin:themes'],
        options: {
          spawn: false,
          livereload: 35730
        }
      },
      livereload: {
        options: {
          livereload: '<%= connect.server.options.livereload %>'
        },
        files: [
          '.tmp/css/**/*.css',
          '<%= config.dist %>/themes/css/cartodb.css'
        ]
      }
    };
  }
};
