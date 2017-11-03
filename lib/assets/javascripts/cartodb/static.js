const Carto = require('../../core/javascripts/carto-node/index.js.babel');
const PACKAGE = require('../../../../package.json');
const version = PACKAGE.version;

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

(function (window, document) {
  var client = new Carto.AuthenticatedClient();

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

  client.getConfig(function (err, response, data) {
    window.CartoConfig.data = data;

    if (err) {
      console.error(err);
    } else {
      var spinnerEl = document.querySelector('.spinner');
      spinnerEl.classList.add('is-hidden');

      var assetsUrl = getAssetsBaseUrl() + getAssetsVersion();

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
    }
  });
})(window, document);
