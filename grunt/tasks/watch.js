/**
 *  Watch grunt task for CartoDB.js
 *
 */
module.exports = {
  task: function() {
    return {
      scss: {
        files: ['themes/scss/**/*.scss'],
        tasks: ['css', 'concat:themes', 'cssmin:themes'],
        options: {
          spawn: false,
          livereload: true
        }
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '.tmp/css/**/*.css',
          '<%= config.dist %>/themes/css/cartodb.css'
        ]
      }
    }
  }
}
