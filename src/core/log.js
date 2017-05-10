var Backbone = require('backbone');
var cdb = require('../cdb'); // cdb.VERSION
var errors = require('../cdb.errors');
var config = require('../cdb.config');


var Log = Backbone.Model.extend({

  error: function() {
    console.error.apply(console, arguments);
    if(config.ERROR_TRACK_ENABLED) {
      errors.create({
        msg: Array.prototype.slice.call(arguments).join('')
      });
    }
  },

  log: function() {
    console.log.apply(console, arguments);
  },

  info: function() {
    console.log.apply(console, arguments);
  },

  debug: function() {
    if (cdb.DEBUG) console.log.apply(console, arguments);
  }
});

module.exports = Log;
