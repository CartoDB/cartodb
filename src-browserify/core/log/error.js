var Backbone = require('backbone');

// NOTE this does not return a Error directly, but a wrapper, to inject the dependencies
// e.g. var Error = require('./error')({ config: cdb.config, $: cdb.$ });
// @param {Object} $ jQuery
// @param {Object} config typically cdb.config
module.exports = function($, config) {
  if (!$) throw new Error('$ is required');
  if (!config) throw new Error('config is required');

  var Error = Backbone.Model.extend({

    url: function() {
      return config.REPORT_ERROR_URL;
    },

    initialize: function() {
      this.set({ browser: JSON.stringify($.browser) });
    }
  });

  return Error;
};
