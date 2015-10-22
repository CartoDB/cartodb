var Backbone = require('backbone');
var jQueryProxy = require('jquery-proxy');
var configProxy = require('config-proxy');

var ErrorModel = Backbone.Model.extend({
  url: function() {
    return configProxy.get().REPORT_ERROR_URL;
  },

  initialize: function() {
    this.set({ browser: JSON.stringify(jQueryProxy.get().browser) });
  }
});

module.exports = ErrorModel;
