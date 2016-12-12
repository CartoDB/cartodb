var ServiceItem = require('./service_item_model.js');
var Backbone = require('backbone-cdb-v3');

/**
 *  Service item model + Service items collection
 *
 *  - It needs a datasource name or it won't work.
 *
 */

module.exports = Backbone.Collection.extend({

  _DATASOURCE_NAME: 'dropbox',

  model: ServiceItem,

  initialize: function(coll, opts) {
    if (opts.datasource_name) {
      this._DATASOURCE_NAME = opts.datasource_name;
    }
  },

  fetch: function() {
    this.trigger("fetch", this);

    // Pass through to original fetch.
    return Backbone.Collection.prototype.fetch.apply(this, arguments);
  },

  parse: function(r) {
    return r.files;
  },

  url: function(method) {
    var version = cdb.config.urlVersion('imports_service', method);
    return '/api/' + version + '/imports/service/' + this._DATASOURCE_NAME + '/list_files'
  }

});
