var Backbone = require('backbone');
var jQueryProxy = require('jquery-proxy');
var config = require('cdb.config');

var ErrorModel = Backbone.Model.extend({
  url: function() {
    return config.REPORT_ERROR_URL;
  },

  initialize: function() {
    this.set({ browser: JSON.stringify(jQueryProxy.get().browser) });
  }
});

module.exports = ErrorModel;
