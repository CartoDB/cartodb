var Backbone = require('backbone');
var Error = require('./error');

// NOTE this does not return a ErrorList directly, but a wrapper, to inject dependencies
// e.g. var ErrorList = require('./error-list')(Error);
// @param {Object} Error
module.exports = function(Error) {
  var ErrorList = Backbone.Collection.extend({
    model: Error,

    enableTrack: function() {
      var self = this;
      var old_onerror = window.onerror;
      window.onerror = function(msg, url, line) {
        self.create({
          msg: msg,
          url: url,
          line: line
        });
        if (old_onerror)
          old_onerror.apply(window, arguments);
      };
    }
  });

  return ErrorList;
};
