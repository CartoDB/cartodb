/**
 *  SCSS grunt task for CARTO.js
 *
 */

module.exports = {
  task: function () {
    return {
      dist: {
        options: {
          sourceMap: false,
          outputStyle: 'compressed',
          includePaths: [
            'node_modules/cartoassets/src/scss'
          ]
        },
        files: [{
          expand: true,
          src: [
            'node_modules/cartoassets/src/scss/entry.scss',
            'themes/scss/entry.scss'
          ],
          dest: '.tmp/scss',
          ext: '.css'
        }]
      }
    };
  }
};
