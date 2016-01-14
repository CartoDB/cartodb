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
            'node_modules/cartoassets/src/scss/utilities/*.scss',
            'node_modules/cartoassets/src/scss/components/*.scss',
            'node_modules/perfect-scrollbar/**/*.scss',
            'themes/scss/**/*.scss'
          ],
          dest: '.tmp/scss',
          ext: '.css'
        }]
      }
    }
  }
};
