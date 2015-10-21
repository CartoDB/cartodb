/**
 *  Image minifier grunt task for CartoDB.js
 *
 */
module.exports = {
  task: function() {
    return {
      distCSSImages: {
        options: {
          progressive: true
        },
        files: [{
          expand: true,
          cwd: 'themes/css',
          src: [ 'images/**/*.{png,jpg,gif}' ],
          dest: '<%= config.dist %>/themes/css'
        }]
      },

      distImages: {
        options: {
          progressive: true
        },
        files: [{
          expand: true,
          cwd: 'themes/img',
          src: [ '**/*.{png,jpg,gif}' ],
          dest: '<%= config.dist %>/themes/img'
        }]
      }
    }
  }
}
