var Backbone = require('backbone');

module.exports = function(ErrorModel) {
  if (!ErrorModel) throw new Error('ErrorModel is required');

  var ErrorList = Backbone.Collection.extend({
    model: ErrorModel,

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
