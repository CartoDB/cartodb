
/**
 *  Watch grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      server: [
        'compass:server',
        'copy:stageCss',
      ],
      dist: [
        'compass:dist',
        'copy:dist'
      ]
    }
  }
}