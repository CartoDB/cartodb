/**
 *  SCSS grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function(grunt, config) {
    return {
      dist: {
        options: {
          sourceMap: false,
          outputStyle: 'compressed'
        },
        files: [{
          expand: true,
          src: [
            'vendor/**/*.css',
            'themes/scss/**/*.scss'
          ],
          dest: '.tmp/scss',
          ext: '.css'
        }]
      }
    }
  }
}
