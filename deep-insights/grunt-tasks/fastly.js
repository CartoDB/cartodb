
/**
 *  Fastly invalidation grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      options: {
        key: '<%= secrets.FASTLY_API_KEY %>'
      },
      dist: {
        options: {
          purgeAll: true,
          serviceId: '<%= secrets.FASTLY_CARTODB_SERVICE %>'
        }
      },
    }
  }
}