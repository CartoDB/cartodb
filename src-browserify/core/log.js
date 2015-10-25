var Backbone = require('backbone');
var cdbProxy = require('cdb-proxy'); // cdb.config, cdb.errors, cdb.DEBUG

// TODO: Is this fake console/IE7 still necessary?
var _console;
var _fake_console = function() {};
_fake_console.prototype.error = function(){};
_fake_console.prototype.log= function(){};

//IE7 love
if (typeof console !== "undefined") {
  _console = console;
  try {
    _console.log.apply(_console, ['cartodb.js ' + cartodb.VERSION])
  } catch(e) {
    _console = new _fake_console();
  }
} else {
  _console = new _fake_console();
}

var Log = Backbone.Model.extend({

  error: function() {
    _console.error.apply(_console, arguments);
    if(cdbProxy.get().config.ERROR_TRACK_ENABLED) {
      cdbProxy.get().errors.create({
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
    if (cdbProxy.get().DEBUG) _console.log.apply(_console, arguments);
  }
});

module.exports = Log;
