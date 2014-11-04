
/**
 *  File revision grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      options: {
        length: 4
      },
      dist: {
        files: [{
          src: [
            '<%= config.dist %>/js/**/*.js',
            '<%= config.dist %>/css/**/*.css',
            '<%= config.dist %>/img/**/*.{gif,jpg,jpeg,png,svg,webp}',
            '<%= config.dist %>/fonts/**/*.{eot*,otf,svg,ttf,woff}'
          ]
        }]
      }
    }
  }
}