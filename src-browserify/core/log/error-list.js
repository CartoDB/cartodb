var Backbone = require('backbone');
var Error = require('./error');

var ErrorList = Backbone.Collection.extend({
  model: Error,

  enableTrack: function() {
    var old_onerror = window.onerror;
    window.onerror = function(msg, url, line) {
      cdb.errors.create({
        msg: msg,
        url: url,
        line: line
      });
      if (old_onerror)
        old_onerror.apply(window, arguments);
    };
  }
});

module.exports = ErrorList;
