/**
 *  Clean grunt task for CartoDB.js
 *
 */
module.exports = {
  task: function() {
    return {
      dist: {
        files: [{
          dot: true,
          src: [
            '.sass-cache',
            '.tmp',
            '<%= config.dist %>',
            '!<%= config.dist %>/.git*'
          ]
        }]
      }
    }
  }
}
