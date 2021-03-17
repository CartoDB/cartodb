module.exports = {
  getAssetsVersion: function (version) {
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    let i = 0;

    for (i; i < vars.length; i++) {
      const pair = vars[i].split('=');

      if (pair[0] === 'v') {
        return pair[1];
      }
    }

    return window.StaticConfig.assetVersion || (window.CartoConfig && window.CartoConfig.data && window.CartoConfig.data.user_frontend_version) || version;
  },

  getAssetsBaseUrl: function () {
    const data = window.CartoConfig.data;
    const dataAssetsHost = data && data.asset_host ? data.asset_host + '/assets' : '';

    const assetsBaseUrl =
      window.StaticConfig.assetsBaseUrl ||
      dataAssetsHost ||
      data.config.app_assets_base_url;

    return assetsBaseUrl + '/';
  },

  getAssetsUrl: function (version) {
    return this.getAssetsBaseUrl() + this.getAssetsVersion(version);
  }
};
