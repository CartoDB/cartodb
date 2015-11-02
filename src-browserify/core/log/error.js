var Backbone = require('backbone');
var $ = require('jquery');
var config = require('cdb.config');

var ErrorModel = Backbone.Model.extend({
  url: function() {
    return config.REPORT_ERROR_URL;
  },

  initialize: function() {
    this.set({ browser: JSON.stringify($.browser) });
  }
});

module.exports = ErrorModel;
