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
    this._baseUrl = opts.baseUrl;
    this._tableModel = opts.tableModel;
  },

  url: function () {
    var version = cdb.config.apiUrlVersion('column');
    return _.result(this, '_baseUrl') + '/api/' + version + '/tables/' + this._tableModel.get('name') + '/columns';
  }

});
