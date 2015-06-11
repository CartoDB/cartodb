cdb.common = {};
cdb.admin = {};
cdb.admin.dashboard = {};
cdb.forms = {};
cdb.open = {};
cdb.dashboard = {};

cdb.config.setUrlVersion = function(modelName, method, v) {
  cdb.config.set(modelName + '_' + method + '_url_version', v || 'v1');
}

cdb.config.urlVersion = function(modelName, method, defaultVersion) {
  method = method || ''
  var version = cdb.config.get(modelName + "_" + method + '_url_version')
  return version || defaultVersion || 'v1';
}

// return prefixUrl for all the queries to the rest api
cdb.config.prefixUrl = function() {
  return this.get('url_prefix') || '';
};

// if the prefixUrl is like http://host.com/u/o returns
// /u/o part
cdb.config.prefixUrlPathname = function() {
  var prefix = this.prefixUrl();
  if (prefix !== '') {
    try {
      if (prefix && prefix.indexOf('/') === -1) throw new TypeError('invalid URL');
      var a = document.createElement('a');
      a.href = prefix;
      var url = a.pathname;
      // remove trailing slash
      return url.replace(/\/$/, '');
    } catch(e) {
      // not an url
    }
  }
  return prefix;
};

