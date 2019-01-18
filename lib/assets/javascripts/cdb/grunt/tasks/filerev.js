
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
            '<%= config.dist %>/<%= config.app %>/js/**/*.js',
            '<%= config.dist %>/<%= config.app %>/css/**/*.css',
            '<%= config.dist %>/<%= config.app %>/img/**/*.{gif,jpg,jpeg,png,svg,webp}',
            '<%= config.dist %>/<%= config.app %>/fonts/**/*.{eot*,otf,svg,ttf,woff}'
          ]
        }]
      }
    }
  }
}