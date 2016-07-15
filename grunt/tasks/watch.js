/**
 *  Watch grunt task for CartoDB.js
 *
 */
module.exports = {
  task: function () {
    return {
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
