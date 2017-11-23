const PACKAGE = require('../../../../package.json');
const version = PACKAGE.version;
var CartoNode = require('../../../../vendor/assets/javascripts/carto-node/carto-node.js');

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

(function (window, document) {
  var client = new CartoNode.AuthenticatedClient();

  function getAssetsVersion () {
    var query = window.location.search.substring(1);
    var vars = query.split('&');

    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');

      if (pair[0] === 'v') {
        return pair[1];
      }
    }

    return window.StaticConfig.assetVersion || window.CartoConfig.data.user_frontend_version || version;
  }

  function getAssetsBaseUrl () {
    var data = window.CartoConfig.data;
    var userAssetsHost = data.asset_host;

    return (window.StaticConfig.assetsBaseUrl || userAssetsHost && userAssetsHost + '/assets' || data.config.app_assets_base_url) + '/';
  }

  function redirectToLogin () {
    window.location = '/login';
  }

  client.getConfig(function (error, response, data) {
    window.CartoConfig.data = data;

    if (error) {
      console.error(error);
      return redirectToLogin();
    }

    if (!data.user_data) {
      return redirectToLogin();
    }

    var spinnerEl = document.querySelector('.spinner');
    var assetsUrl = getAssetsBaseUrl() + getAssetsVersion();

    spinnerEl.classList.add('is-hidden');

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
    })(window, document, assetsUrl, '/favicons/favicon.ico', window.StaticConfig.stylesheets, window.StaticConfig.scripts);
  });
})(window, document);
