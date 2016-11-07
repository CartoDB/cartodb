//i18n
//
function _t(s) {
  return s;
}

var i18n = {
  // format('hello, {0}', 'rambo') -> "hello, rambo"
  format: function (str) {
    for(var i = 1; i < arguments.length; ++i) {
      var attrs = arguments[i];
      for(var attr in attrs) {
        str = str.replace(RegExp('\\{' + attr + '\\}', 'g'), attrs[attr]);
      }
    }
    return str;
  }
};

(function() {

  // helper functions needed from backbone (they are not exported)
  var getValue = function(object, prop, method) {
    if (!(object && object[prop])) return null;
    return _.isFunction(object[prop]) ? object[prop](method) : object[prop];
  };

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // backbone.sync replacement to control url prefix
  Backbone.originalSync = Backbone.sync;
  Backbone.sync = function(method, model, options) {
    var url = options.url || getValue(model, 'url', method) || urlError();
    // prefix if http is not present
    var absoluteUrl = url.indexOf('http') === 0 || url.indexOf("//") === 0;
    if (!absoluteUrl) {
      options.url = cdb.config.prefixUrl() + url;
    } else {
      options.url = url;
    }
    return Backbone.originalSync(method, model, options);
  };

  Backbone.currentSync = Backbone.sync;
  Backbone.withCORS = function(method, model, options) {
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
})();

Backbone.syncAbort = function() {
  var self = arguments[1];
  if (self._xhr) {
    self._xhr.abort();
  }
  self._xhr = Backbone.sync.apply(this, arguments);
  self._xhr.always(function() { self._xhr = null; });
  return self._xhr;
};

Backbone.delayedSaveSync = function(sync, delay) {
  var dsync = _.debounce(sync, delay);
  return function(method, model, options) {
    if (method === 'create' || method === 'update') {
      return dsync(method, model, options);
    } else {
      return sync(method, model, options);
    }
  }
}

Backbone.saveAbort = function() {
  var self = this;
  if (this._saving && this._xhr) {
    this._xhr.abort();
  }
  this._saving = true;
  var xhr = Backbone.Model.prototype.save.apply(this, arguments);
  this._xhr = xhr;
  xhr.always(function() { self._saving = false; });
  return xhr;
};
