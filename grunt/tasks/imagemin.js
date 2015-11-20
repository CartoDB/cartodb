/**
 *  Image minifier grunt task for CartoDB.js
 *
 */
module.exports = {
  task: function() {
    return {
      // distSVG: {
      //   options: {
      //     progressive: true
      //   },
      //   files: [{
      //     expand: true,
      //     cwd: 'themes/svg',
      //     src: [ '**/*.svg' ],
      //     dest: '<%= config.dist %>/themes/svg'
      //   }]
      // },

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
