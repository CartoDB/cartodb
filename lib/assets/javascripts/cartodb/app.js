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

cdb.config.isOrganizationUrl = function() {
  return window.location.pathname.search(this.organizationUrl()) !== -1;
}

// returns true if the current url is a organization one
cdb.config.organizationUrl = function() {
  var username = this.get('user_name');
  return '/u/' + username;
}

// return prefixUrl for all the queries to the rest api
cdb.config.prefixUrl = function() {
  return this.get('url_prefix') || '';
};

(function() {

  // helper functions needed frmo backbone (they are not exported)
  var getValue = function(object, prop) {
    if (!(object && object[prop])) return null;
    return _.isFunction(object[prop]) ? object[prop]() : object[prop];
  };

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // backbone.sync replacement to control url prefix
  Backbone.originalSync = Backbone.sync;
  Backbone.sync = function(method, model, options) {
    var url = options.url || getValue(model, 'url') || urlError();
    // prefix if http is not present
    var absoluteUrl = url.indexOf('http') === 0 || url.indexOf("//") === 0;
    if (!absoluteUrl) {
      options.url = cdb.config.prefixUrl() + url;
    } else {
      options.url = url;
    }
    return Backbone.originalSync(method, model, options);
  };

})();

Backbone.syncAbort = function() {
  var self = this;
  if (this._xhr) {
    this._xhr.abort();
  }
  this._xhr = Backbone.sync.apply(this, arguments);
  this._xhr.always(function() { self._xhr = null; });
  return this._xhr;
};

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

cdb.admin = {};
cdb.common = {};
cdb.admin.dashboard = {};
cdb.forms = {};
cdb.open = {};

