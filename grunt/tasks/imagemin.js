/**
 *  Image minifier grunt task for CartoDB.js
 *
 */
module.exports = {
  task: function() {
    return {
      distImages: {
        options: {
          progressive: true
        },
        files: [{
          expand: true,
          cwd: 'themes/img',
          src: [ '**/*.{png,jpg,gif,svg}' ],
          dest: '<%= config.dist %>/themes/img'
        }]
      }
    }
  }
}
