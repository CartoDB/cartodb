var _ = require('underscore');
var Backbone = require('backbone');
var ColumnModel = require('./column-model');

/**
 * A collection Columns
 */
module.exports = Backbone.Collection.extend({

  model: ColumnModel,

  initialize: function (models, opts) {
    if (!opts.baseUrl) throw new Error('baseUrl is required');
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    this._baseUrl = opts.baseUrl;
    this._tableModel = opts.tableModel;
    this._configModel = opts.configModel;
  },

  url: function () {
    var version = this._configModel.apiUrlVersion('column');
    return _.result(this, '_baseUrl') + '/api/' + version + '/tables/' + this._tableModel.get('name') + '/columns';
  }

});
