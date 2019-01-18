
/**
 *  Css lint grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      options: {
        assetsDirs: '<%= config.dist %>/<%= config.app %>',
      },
      html: ['<%= config.dist %>/<%= config.app %>/**/*.html'],
      css: ['<%= config.dist %>/<%= config.app %>/css/**/*.css']
    }
  }
}