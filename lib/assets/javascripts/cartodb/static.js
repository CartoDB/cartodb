var CARTO = require('../carto-node/index');

(function(window, document) {
  var client = new CARTO.AuthenticatedClient();

  client.getConfig(function (err, response, data) {
    function getScriptURL () {
      var script =  document.currentScript || document.querySelector('script')

      return script.src;
    }

    function getAssetsUrl () {
      var query = window.location.search.substring(1);
      var vars = query.split("&");

      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");

        if (pair[0] === "v") {
          return pair[1];
        }
      }

      return data.config.frontend_version || "/assets/" + getScriptURL().split("/assets/")[1].split("/javascripts/")[0];
    }

    var assetsUrl = getAssetsUrl();

    (function(w, d, favicon, stylesheets, scripts, l, h, s, t) {
      var l = d.createElement('link');
      l.rel = 'shortcut icon';
      l.href = favicon;
      h = d.getElementsByTagName('head')[0];
      h.parentNode.insertBefore(l, h);

      stylesheets.forEach(function(src) {
        var l = d.createElement('link');
        l.rel = 'stylesheet';
        l.href = src;
        h = d.getElementsByTagName('head')[0];
        h.parentNode.insertBefore(l, h);
      });

      scripts.forEach(function(src) {
        var s = d.createElement('script');
        t = d.getElementsByTagName('script')[0];
        s.async = false;
        s.src = src;
        t.parentNode.insertBefore(s, t);
      });
    })(window, document, assetsUrl + '/favicons/favicon.ico', [
      assetsUrl + '/stylesheets/cartodb.css',
      assetsUrl + '/stylesheets/common.css',
      assetsUrl + '/stylesheets/dashboard.css'
    ], [
      assetsUrl + '/javascripts/cdb_static.js',
      assetsUrl + '/javascripts/models_static.js',
      assetsUrl + '/javascripts/dashboard_templates_static.js',
      assetsUrl + '/javascripts/dashboard_deps_static.js',
      assetsUrl + '/javascripts/dashboard_static.js'
    ]);
  });
})(window, document);
