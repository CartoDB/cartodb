
/**
 *  HTML minifier grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      dist: {
        options: {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true
        },
        files: [{
          expand: true,
          cwd: '<%= config.dist %>/<%= config.app %>',
          src: '**/*.html',
          dest: '<%= config.dist %>/<%= config.app %>'
        }]
      }
    }
  }
}