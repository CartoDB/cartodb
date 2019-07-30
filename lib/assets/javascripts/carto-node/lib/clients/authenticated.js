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

  like (itemId, callback) {
    const CONFIG_PATH = 'api/v1/viz';
    var opts = {
      dataType: 'json'
    };
    return this.post([CONFIG_PATH, itemId, 'like'], opts, callback);
  }

  deleteLike (itemId, callback) {
    const CONFIG_PATH = 'api/v1/viz';
    var opts = {
      dataType: 'json'
    };
    return this.delete([CONFIG_PATH, itemId, 'like'], opts, callback);
  }

  updateNotification (userId, apiKey, notification, callback) {
    const CONFIG_PATH = [`/api/v3/users/${userId}/notifications/${notification.id}?api_key=${apiKey}`];
    const opts = {
      data: JSON.stringify({
        notification
      }),
      dataType: 'json'
    };

    return this.put(CONFIG_PATH, opts, callback);
  }

  getTags (options, callback) {
    const URIParts = ['api/v3/tags'];
    const URLParameters = {
      q: options.q,
      page: options.page || 1,
      per_page: options.perPage || 6,
      types: options.types || 'derived,table',
      include_shared: options.include_shared || false
    };

    const queryOptions = {
      data: URLParameters
    };

    return this.get(URIParts, queryOptions, callback);
  }

  previewSearch (query, callback) {
    const URIParts = ['api/v3/search_preview'];
    const URLParameters = {
      types: 'derived,table,tag',
      limit: 4
    };

    const queryOptions = {
      data: URLParameters
    };

    return this.get([URIParts, encodeURIComponent(query)], queryOptions, callback);
  }

  getApiKeys (type, callback) {
    const URIParts = ['api/v3/api_keys'];
    const URLParameters = {
      type: type
    };

    const queryOptions = {
      data: URLParameters
    };

    return this.get(URIParts, queryOptions, callback);
  }

  getOAuthApps (apiKey, callback) {
    const CONFIG_PATH = [`api/v4/oauth_apps?api_key=${apiKey}`];

    return this.get(CONFIG_PATH, callback);
  }

  createApp (apiKey, app, callback) {
    const CONFIG_PATH = [`api/v4/oauth_apps?api_key=${apiKey}`];
    const opts = {
      data: JSON.stringify(app),
      dataType: 'json'
    };
    return this.post(CONFIG_PATH, opts, callback);
  }

  updateApp (apiKey, app, callback) {
    const CONFIG_PATH = [`api/v4/oauth_apps/${app.id}?api_key=${apiKey}`];
    const opts = {
      data: JSON.stringify(app),
      dataType: 'json'
    };
    return this.put(CONFIG_PATH, opts, callback);
  }

  deleteApp (apiKey, app, callback) {
    const CONFIG_PATH = [`api/v4/oauth_apps/${app.id}?api_key=${apiKey}`];
    const opts = {
      data: JSON.stringify(app),
      dataType: 'json'
    };
    return this.delete(CONFIG_PATH, opts, callback);
  }

  regenerateClientSecret (apiKey, app, callback) {
    const CONFIG_PATH = [`api/v4/oauth_apps/${app.id}/regenerate_secret?api_key=${apiKey}`];
    const opts = {
      data: JSON.stringify(app),
      dataType: 'json'
    };
    return this.post(CONFIG_PATH, opts, callback);
  }

  uploadLogo (apiKey, userId, filename, callback) {
    const CONFIG_PATH = [`api/v1/users/${userId}/assets?api_key=${apiKey}`];
    const data = new FormData();
    data.append('kind', 'orgavatar');
    data.append('filename', filename);
    const opts = {
      data,
      contentType: false
    };
    return this.post(CONFIG_PATH, opts, callback);
  }
}

module.exports = AuthenticatedClient;
