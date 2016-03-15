var Backbone = require('backbone');

/**
 * global configuration
 */
var Config = Backbone.Model.extend({
  VERSION: 4,

  initialize: function() {},

  //error track
  REPORT_ERROR_URL: '/api/v0/error',
  ERROR_TRACK_ENABLED: false
});

module.exports = Config;
