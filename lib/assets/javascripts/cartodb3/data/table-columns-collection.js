var Backbone = require('backbone');
var ColumnModel = require('./column-model');

/**
 * A collection of table columns
 */
module.exports = Backbone.Collection.extend({

  model: ColumnModel,

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.tableModel) throw new Error('tableModel is required');

    this._configModel = opts.configModel;
    this._tableModel = opts.tableModel;
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('column');
    return baseUrl + '/api/' + version + '/tables/' + this._tableModel.get('name') + '/columns';
  }

});
