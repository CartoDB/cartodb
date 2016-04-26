var ServiceItem = require('./import-service-item-model');
var Backbone = require('backbone');

/**
 *  Service item model + Service items collection
 *
 *  - It needs a datasource name or it won't work.
 *
 */

module.exports = Backbone.Collection.extend({

  _DATASOURCE_NAME: 'dropbox',

  model: ServiceItem,

  url: function (method) {
    var version = this._configModel.urlVersion('imports_service');
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/' + version + '/imports/service/' + this._DATASOURCE_NAME + '/list_files';
  },

  initialize: function (coll, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.datasourceName) throw new Error('datasourceName is required');
    this._configModel = opts.configModel;
    this._DATASOURCE_NAME = opts.datasourceName;
  },

  fetch: function () {
    this.trigger('fetch', this);
    return Backbone.Collection.prototype.fetch.apply(this, arguments);
  },

  parse: function (r) {
    return r.files;
  }

});
