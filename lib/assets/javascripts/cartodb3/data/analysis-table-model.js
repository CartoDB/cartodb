var cdb = require('cartodb.js');
var Backbone = require('backbone');
var TableModel = require('./table-model');
var TableQueryModel = require('./table-query-model');

/**
 * Model to represent an analysis in the context of a layer definition.
 * A table may have a SQL query applied, which affects both the columns available as well as its data (rows).
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    fetched: false,
    query: null
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
    this._tableQueryModel = new TableQueryModel({
      query: attrs.query
    }, {
      configModel: this._configModel
    });

    this.on('change:query', this._updateQuery, this);
    this.columnsCollection = new Backbone.Collection();

    this.listenTo(this._tableQueryModel, 'sync', this._onTableQuerySync);
    this.listenTo(this._tableQueryModel, 'request', this.trigger.bind(this, 'request'));
    this.listenTo(this._tableQueryModel, 'sync', this.trigger.bind(this, 'sync'));
    this.listenTo(this._tableQueryModel, 'error', this.trigger.bind(this, 'error'));
  },

  _updateQuery: function () {
    this._tableQueryModel.set('query', this.get('query'));
  },

  fetch: function () {
    var m = this._tableQueryModel;

    // Pass through any arguments as-is
    m.fetch.apply(m, arguments);
  },

  _onTableQuerySync: function () {
    this._changeModels(this._tableQueryModel.columnsCollection.models);
  },

  _changeModels: function (models) {
    this.columnsCollection.reset(models);
    this.set('fetched', true);
  }

});
