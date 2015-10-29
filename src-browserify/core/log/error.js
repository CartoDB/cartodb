var Backbone = require('backbone');
var jQueryProxy = require('jquery-proxy');
var cdbProxy = require('cdb-proxy'); // cdb.config

var ErrorModel = Backbone.Model.extend({
  url: function() {
    return cdbProxy.get().config.REPORT_ERROR_URL;
  },

  initialize: function() {
    this.set({ browser: JSON.stringify(jQueryProxy.get().browser) });
  }
});

module.exports = ErrorModel;
