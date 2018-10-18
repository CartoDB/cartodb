var _ = require('underscore');
var Backbone = require('backbone');

(function () {
  // helper functions needed from backbone (they are not exported)
  var getValue = function (object, prop, method) {
    if (!(object && object[prop])) return null;
    return _.isFunction(object[prop]) ? object[prop](method) : object[prop];
  };

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function () {
    throw new Error('A "url" property or function must be specified');
  };

  // backbone.sync replacement to control url prefix
  Backbone.originalSync = Backbone.sync;
  Backbone.sync = function (method, model, options) {
    var url = options.url || getValue(model, 'url', method) || urlError();
    // prefix if http is not present
    var absoluteUrl = url.indexOf('http') === 0 || url.indexOf('//') === 0;
    if (!absoluteUrl) {
      // We need to fix this
      // this comes from cdb.config.prefixUrl
      options.url = (model._configModel || model._config || model).get('base_url') + url;
    } else {
      options.url = url;
    }
    if (method !== 'read') {
      // remove everything related
      if (model.surrogateKeys) {
        Backbone.cachedSync.invalidateSurrogateKeys(getValue(model, 'surrogateKeys'));
      }
    }
    return Backbone.originalSync(method, model, options);
  };

  Backbone.currentSync = Backbone.sync;
  Backbone.withCORS = function (method, model, options) {
    if (!options) {
      options = {};
    }

    if (!options.crossDomain) {
      options.crossDomain = true;
    }

    if (!options.xhrFields) {
      options.xhrFields = { withCredentials: true };
    }

    return Backbone.currentSync(method, model, options);
  };

  // this method returns a cached version of backbone sync
  // take a look at https://github.com/teambox/backbone.memoized_sync/blob/master/backbone.memoized_sync.js
  // this is the same concept but implemented as a wrapper for ``Backbone.sync``
  // usage:
  // initialize: function () {
  //    this.sync = Backbone.cachedSync(this.user_name);
  // }
  Backbone.cachedSync = function (namespace, sync) {
    if (!namespace) {
      throw new Error('cachedSync needs a namespace as argument');
    }

    var surrogateKey = namespace;
    var session = window.user_data && window.user_data.username;
    // no user session, no cache
    // there should be a session to have cache so we avoid
    // cache collision for someone with more than one account
    if (session) {
      namespace += '-' + session;
    } else {
      return Backbone.sync;
    }

    var namespaceKey = 'cdb-cache/' + namespace;

    // saves all the localstore references to the namespace
    // inside localstore. It allows to remove all the references
    // at a time
    var index = {
      // return a list of references for the namespace
      _keys: function () {
        return JSON.parse(localStorage.getItem(namespaceKey) || '{}');
      },

      // add a new reference for the namespace
      add: function (key) {
        var keys = this._keys();
        keys[key] = +new Date();
        localStorage.setItem(namespaceKey, JSON.stringify(keys));
      },

      // remove all the references for the namespace
      invalidate: function () {
        var keys = this._keys();
        _.each(keys, function (v, k) {
          localStorage.removeItem(k);
        });
        localStorage.removeItem(namespaceKey);
      }
    };

    // localstore-like cache wrapper
    var cache = {
      setItem: function (key, value) {
        localStorage.setItem(key, value);
        index.add(key);
        return this;
      },

      // this is async in case the data needs to be compressed
      getItem: function (key, callback) {
        var val = localStorage.getItem(key);
        _.defer(function () {
          callback(val);
        });
      },

      removeItem: function (key) {
        localStorage.removeItem(key);
        index.invalidate();
      }
    };

    var cached = function (method, model, options) {
      var url = options.url || getValue(model, 'url') || urlError();
      var key = namespaceKey + '/' + url;

      if (method === 'read') {
        var success = options.success;
        var cachedValue = null;

        options.success = function (resp, status, xhr) {
          // if cached value is ok
          if (cachedValue && xhr.responseText === cachedValue) {
            return;
          }
          cache.setItem(key, xhr.responseText);
          success(resp, status, xhr);
        };

        cache.getItem(key, function (val) {
          cachedValue = val;
          if (val) {
            success(JSON.parse(val), 'success');
          }
        });
      } else {
        cache.removeItem(key);
      }
      return (sync || Backbone.sync)(method, model, options);
    };

    // create a public function to invalidate all the namespace
    // items
    cached.invalidate = function () {
      index.invalidate();
    };

    // for testing and debugging porpuposes
    cached.cache = cache;

    // have a global namespace -> sync function in order to avoid invalidation
    Backbone.cachedSync.surrogateKeys[surrogateKey] = cached;

    return cached;
  };

  Backbone.cachedSync.surrogateKeys = {};

  Backbone.cachedSync.invalidateSurrogateKeys = function (keys) {
    _.each(keys, function (k) {
      var s = Backbone.cachedSync.surrogateKeys[k];
      if (s) {
        s.invalidate();
      } else {
        console.error('Backbone sync options: surrogate key not found: ' + k);
      }
    });
  };

  Backbone.syncAbort = function () {
    var self = arguments[1];
    if (self._xhr) {
      self._xhr.abort();
    }
    self._xhr = Backbone.sync.apply(this, arguments);
    self._xhr.always(function () { self._xhr = null; });
    return self._xhr;
  };

  Backbone.delayedSaveSync = function (sync, delay) {
    var dsync = _.debounce(sync, delay);
    return function (method, model, options) {
      if (method === 'create' || method === 'update') {
        return dsync(method, model, options);
      } else {
        return sync(method, model, options);
      }
    };
  };

  Backbone.saveAbort = function () {
    var self = this;
    if (this._saving && this._xhr) {
      this._xhr.abort();
    }
    this._saving = true;
    var xhr = Backbone.Model.prototype.save.apply(this, arguments);
    this._xhr = xhr;
    xhr.always(function () { self._saving = false; });
    return xhr;
  };
})();
