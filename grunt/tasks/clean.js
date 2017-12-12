/**
 *  Clean grunt task for CartoDB.js
 *
 */
module.exports = {
  task: function() {
    return {
      dist_internal: {
        files: [{
          dot: true,
          src: [
            '.sass-cache',
            '.tmp',
            '<%= dist %>/internal',
            '!<%= dist %>/.git*'
          ]
        }]
      }
    }
  }
}
