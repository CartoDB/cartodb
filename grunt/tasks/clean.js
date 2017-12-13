/**
 *  Clean grunt task for Carto.js
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
