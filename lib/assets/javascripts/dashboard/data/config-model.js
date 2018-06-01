var Backbone = require('backbone');

/**
 * Model for general frontend configuration.
 * Ported from old cdb.config, since we can't reuse the older model that's tied to v3 of cartodb.js
 *
 * Also, rather than putting it as a global object, it's intended to be instantiated at the entry point and passed as
 * a collaborator object the models that needs it, e.g.:
 * var myModel = new MyModel({ id: 123, … }, {
 *   configModel: configModel
 * })
 */
module.exports = Backbone.Model.extend({

  VERSION: 2,

  initialize: function () {
    this.modules = new Backbone.Collection();
    this.modules.on('add', function (model) {
      this.trigger('moduleLoaded');
      this.trigger('moduleLoaded:' + model.get('name'));
    }, this);
  },

  // error track
  REPORT_ERROR_URL: '/api/v0/error',
  ERROR_TRACK_ENABLED: false,

  /**
   * returns the base url to compose the final url
   * http://user.carto.com/
   */
  getSqlApiBaseUrl: function () {
    var url;
    if (this.get('sql_api_template')) {
      url = this.get('sql_api_template').replace('{user}', this.get('user_name'));
    } else {
      url = this.get('sql_api_protocol') + '://' +
        this.get('user_name') + '.' +
        this.get('sql_api_domain') + ':' +
        this.get('sql_api_port');
    }
    return url;
  },

  /**
   * returns the full sql api url, including the api endpoint
   * allos to specify the version
   * http://user.carto.com/api/v1/sql
   */
  getSqlApiUrl: function (version) {
    version = version || 'v2';
    return this.getSqlApiBaseUrl() + '/api/' + version + '/sql';
  },

  /**
   *  returns the maps api host, removing user template
   *  and the protocol.
   *  carto.com:3333
   */
  getMapsApiHost: function () {
    var url;
    var mapsApiTemplate = this.get('maps_api_template');
    if (mapsApiTemplate) {
      url = mapsApiTemplate.replace(/https?:\/\/{user}\./, '');
    }
    return url;
  },

  setUrlVersion: function (modelName, method, v) {
    this.set(modelName + '_' + method + '_url_version', v || 'v1');
  },

  urlVersion: function (modelName, method, defaultVersion) {
    method = method || '';
    var version = this.get(modelName + '_' + method + '_url_version');
    return version || defaultVersion || 'v1';
  },

  prefixUrl: function () {
    return this.get('url_prefix') || '';
  },

  prefixUrlPathname: function () {
    var prefix = this.prefixUrl();
    if (prefix !== '') {
      try {
        if (prefix && prefix.indexOf('/') === -1) throw new TypeError('invalid URL');
        var a = document.createElement('a');
        a.href = prefix;
        var url = a.pathname;
        // remove trailing slash
        return url.replace(/\/$/, '');
      } catch (e) {
        // not an url
      }
    }
    return prefix;
  },

  getMapsResourceName: function (username) {
    var url;
    var mapsApiTemplate = this.get('maps_api_template');
    if (mapsApiTemplate) {
      url = mapsApiTemplate.replace(/(http|https)?:\/\//, '').replace(/{user}/g, username);
    }
    return url;
  },

  dataLibraryEnabled: function () {
    return this.get('data_library_enabled');
  },

  isHosted: function () {
    return this.get('cartodb_com_hosted');
  }
});
