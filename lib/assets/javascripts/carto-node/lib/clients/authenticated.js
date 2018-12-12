const PublicClient = require('./public.js');

class AuthenticatedClient extends PublicClient {
  getConfig (callback) {
    var CONFIG_PATH = 'api/v3/me';

    return this.get([CONFIG_PATH], callback);
  }

  getVisualization (vizUrl, params, callback) {
    const VIZ_API_PATH = 'api/v1/viz';
    const uriParams = this.paramsToURI(params);

    return this.get([VIZ_API_PATH, vizUrl, uriParams], callback);
  }

  getDerivedVisualizations (options, callback) {
    const VIZ_API_PATH = `api/v1/viz`;
    var params = Object.assign({
      type: 'derived',
      privacy: 'public'
    }, options);

    const uriParams = this.paramsToURI(params);

    return this.get([VIZ_API_PATH, uriParams], callback);
  }

  getMap (mapId, callback) {
    const MAPS_API_PATH = 'api/v1/maps';

    return this.get([MAPS_API_PATH, mapId], callback);
  }

  putConfig (payload, callback) {
    const CONFIG_PATH = 'api/v3/me';
    var opts = {
      data: JSON.stringify(payload),
      dataType: 'json'
    };
    return this.put([CONFIG_PATH], opts, callback);
  }

  deleteUser (payload, callback) {
    const CONFIG_PATH = 'api/v3/me';
    var opts = {
      data: JSON.stringify(payload),
      dataType: 'json'
    };
    return this.delete([CONFIG_PATH], opts, callback);
  }
}

module.exports = AuthenticatedClient;
