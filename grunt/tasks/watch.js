/**
 *  Watch grunt task for CARTO.js
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
          '<%= dist %>/internal/themes/css/cartodb.css'
        ]
      }
    };
  }
};
