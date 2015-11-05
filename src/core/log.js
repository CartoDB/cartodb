var Backbone = require('backbone');
var cdb = require('cdb'); // cdb.DEBUG
var errors = require('cdb.errors');
var config = require('cdb.config');

// TODO: Is this fake console/IE7 still necessary?
var _console;
var _fake_console = function() {};
_fake_console.prototype.error = function(){};
_fake_console.prototype.log= function(){};

//IE7 love
if (typeof console !== "undefined") {
  _console = console;
  try {
    _console.log.apply(_console, ['cartodb.js ' + cdb.VERSION])
  } catch(e) {
    _console = new _fake_console();
  }
} else {
  _console = new _fake_console();
}

var Log = Backbone.Model.extend({

  error: function() {
    _console.error.apply(_console, arguments);
    if(config.ERROR_TRACK_ENABLED) {
      errors.create({
        msg: Array.prototype.slice.call(arguments).join('')
      });
    }
  },

  log: function() {
    _console.log.apply(_console, arguments);
  },

  info: function() {
    _console.log.apply(_console, arguments);
  },

  debug: function() {
    if (cdb.DEBUG) _console.log.apply(_console, arguments);
  }
});

module.exports = Log;
