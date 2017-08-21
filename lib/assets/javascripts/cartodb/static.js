var Carto = require('../carto-node/index');
const PACKAGE = require('../../../../package.json');
const version = PACKAGE.version;

(function (window, document) {
  var client = new Carto.AuthenticatedClient();

  client.getConfig(function (err, response, data) {
    function getAssetsVersion () {
      var query = window.location.search.substring(1);
      var vars = query.split('&');

      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');

        if (pair[0] === 'v') {
          return pair[1];
        }
      }

      return data.config.frontend_version || version;
    }

    if (err) {
      console.error('Error getting the config:\n', err);
    } else {
      if (response.statusCode !== 200) {
        window.location.href = '/login';
      }

      var assetHost = '//cartodb-libs.global.ssl.fastly.net/cartodbui';
      var assetsUrl = assetHost + '/assets/' + getAssetsVersion();

      (function (w, d, a, favicon, stylesheets, scripts, l, h, s, t) {
        l = d.createElement('link');
        l.rel = 'shortcut icon';
        l.href = a + favicon;
        h = d.getElementsByTagName('head')[0];
        h.parentNode.insertBefore(l, h);

        stylesheets.forEach(function (src) {
          l = d.createElement('link');
          l.rel = 'stylesheet';
          l.href = a + src;
          h = d.getElementsByTagName('head')[0];
          h.parentNode.insertBefore(l, h);
        });

        scripts.forEach(function (src) {
          s = d.createElement('script');
          t = d.getElementsByTagName('script')[0];
          s.async = false;
          s.src = a + src;
          t.parentNode.insertBefore(s, t);
        });
      })(window, document, assetsUrl, '/favicons/favicon.ico', [
        '/stylesheets/cartodb.css',
        '/stylesheets/common.css',
        '/stylesheets/dashboard.css'
      ], [
        '/javascripts/cdb_static.js',
        '/javascripts/models_static.js',
        '/javascripts/dashboard_templates_static.js',
        '/javascripts/dashboard_deps_static.js',
        '/javascripts/dashboard_static.js'
      ]);
    }
  });
})(window, document);
