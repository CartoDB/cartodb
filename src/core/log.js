/**
 * logging
 */

(function() {

    // error management
    cdb.core.Error = Backbone.Model.extend({
        url: cdb.config.REPORT_ERROR_URL,
        initialize: function() {
            this.set({browser: JSON.stringify($.browser) });
        }
    });

    cdb.core.ErrorList = Backbone.Collection.extend({
        model: cdb.core.Error,
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

    /** contains all error for the application */
    cdb.errors = new cdb.core.ErrorList();


    // error tracking!
    if(cdb.config.ERROR_TRACK_ENABLED) {
      cdb.errors.enableTrack();
    }


    // logging
    var _fake_console = function() {};
    _fake_console.prototype.error = function(){};
    _fake_console.prototype.log= function(){};

    //IE7 love
    if(typeof console !== "undefined") {
        _console = console;
        try {
          _console.log.apply(_console, ['cartodb.js ' + cartodb.VERSION])
        } catch(e) {
          _console = new _fake_console();
        }
    } else {
        _console = new _fake_console();
    }

    cdb.core.Log = Backbone.Model.extend({

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
            _console.log.apply(_console, arguments);
        }
    });

})();

cdb.log = new cdb.core.Log({tag: 'cdb'});
