
/**
 *  Css lint grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      dist: {
        options: {
          check: 'gzip'
        }
      }
    }
  }
}