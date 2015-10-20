var Backbone = require('backbone');

var Error = Backbone.Model.extend({

  url: function() {
    return cartodb.config.REPORT_ERROR_URL;
  },

  initialize: function() {
    // TODO: could we change this to not rely/assume jQuery is loaded?
    var browser;
    try {
      browser = cartodb.$.browser;
    } catch (e) {
      browser = 'cartodb.$.browser throws error; jQuery not loaded?';
    }
    this.set({ browser: JSON.stringify(browser) });
  }
});

module.exports = Error;
