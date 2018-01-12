var Backbone = require('backbone');
var _ = require('underscore');

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

  defaults: {
    base_url: '/CHANGEME' // expected to be set when model is created
  },

  urlVersion: function (modelName, method, defaultVersion) {
    method = method || '';
    var version = this.get(modelName + '_' + method + '_url_version');
    return version || defaultVersion || 'v1';
  },

  /**
   * @param {String} [version=v2] Version of API to use
   * @return {String} the full sql api url, including the api endpoint, e.g. http://user.carto.com/api/v2/sql
   */
  getSqlApiUrl: function (version) {
    version = version || 'v2';
    return this._getSqlApiBaseUrl() + '/api/' + version + '/sql';
  },

  /**
   * @return {String} returns the base url to compose the final url, e.g. http://user.carto.com/
   */
  _getSqlApiBaseUrl: function () {
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

  dataServiceEnabled: function (name) {
    var dataServices = this.get('dataservices_enabled');
    if (!dataServices || !_.size(dataServices) || !name) {
      return false;
    }
    return !!dataServices[name];
  },

  dataLibraryEnabled: function () {
    return this.get('data_library_enabled');
  },

  isHosted: function () {
    return this.get('cartodb_com_hosted');
  }
});
