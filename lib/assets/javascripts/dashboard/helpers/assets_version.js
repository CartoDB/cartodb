module.exports = {
  getAssetsVersion: function (version) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    var i = 0;

    for (i; i < vars.length; i++) {
      var pair = vars[i].split('=');

      if (pair[0] === 'v') {
        return pair[1];
      }
    }

    return window.StaticConfig.assetVersion || window.CartoConfig.data.user_frontend_version || version;
  },

  getAssetsBaseUrl: function () {
    var data = window.CartoConfig.data;
    var dataAssetsHost = data.asset_host && data.asset_host + '/assets';

    var assetsBaseUrl =
      window.StaticConfig.assetsBaseUrl ||
      dataAssetsHost ||
      data.config.app_assets_base_url;

    return assetsBaseUrl + '/';
  },

  getAssetsUrl: function (version) {
    return this.getAssetsBaseUrl() + this.getAssetsVersion(version);
  }
};
