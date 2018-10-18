var Backbone = require('backbone');

/**
 *  Get oauth url from the service requested
 *
 *  - It needs a datasource name or it won't work.
 *
 *  new ServiceOauthModel({ datasourceName: 'dropbox', configModel: configModel })
 */

module.exports = Backbone.Model.extend({

  _DATASOURCE_NAME: 'dropbox',

  url: function (method) {
    var version = this._configModel.urlVersion('imports_service');
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/' + version + '/imports/service/' + this._DATASOURCE_NAME + '/auth_url';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.datasourceName) throw new Error('datasource_name is required');
    this._configModel = opts.configModel;
    this._DATASOURCE_NAME = opts.datasourceName;
  }

});
