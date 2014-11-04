
/**
 *  Css lint grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      options: {
        assetsDirs: '<%= config.dist %>',
      },
      html: ['<%= config.dist %>/**/*.html'],
      css: ['<%= config.dist %>/css/**/*.css']
    }
  }
}