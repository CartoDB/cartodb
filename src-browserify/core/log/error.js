var Backbone = require('backbone');

module.exports = function($, config) {
  if (!$) throw new Error('$ (jQuery) is required');
  if (!config) throw new Error('config (cdb.config) is required');

  var ErrorModel = Backbone.Model.extend({

    url: function() {
      return config.REPORT_ERROR_URL;
    },

    initialize: function() {
      this.set({ browser: JSON.stringify($.browser) });
    }
  });

  return ErrorModel;
};
