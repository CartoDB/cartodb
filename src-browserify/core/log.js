var Backbone = require('backbone');

module.exports = function(cdb) {
  if (!cdb) throw new Error('cdb is required');
  if (!cdb.config) throw new Error('cdb.config is required');
  if (!cdb.errors) throw new Error('cdb.errors (ErrorList) is required');

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
      if(cdb.config.ERROR_TRACK_ENABLED) {
        cdb.errors.create({
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

  return Log;
};
