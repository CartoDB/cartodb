var cdb = require('cartodb.js');
var Backbone = require('backbone');
var TableModel = require('./table-model');
var QuerySchemaModel = require('./query-schema-model');

/**
 * Model to represent table in the context of a layer definition.
 * A table may have a SQL query applied, which affects both the columns available as well as its data (rows).
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    fetched: false,
    table_name: '',
    query: null
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
    this._originalTableModel = new TableModel({
      name: attrs.table_name
    }, {
      configModel: this._configModel
    });
    this._tableQueryModel = new QuerySchemaModel({
      query: attrs.query
    }, {
      configModel: this._configModel
    });
    this.columnsCollection = new Backbone.Collection();

    this.listenTo(this._originalTableModel, 'sync', this._onOriginalTableModelSync);
    this.listenTo(this._tableQueryModel, 'sync', this._onTableQuerySync);

    // Pass on certain events
    [this._originalTableModel, this._tableQueryModel].forEach(function (m) {
      this.listenTo(m, 'request', this.trigger.bind(this, 'request'));
      this.listenTo(m, 'sync', this.trigger.bind(this, 'sync'));
      this.listenTo(m, 'error', this.trigger.bind(this, 'error'));
    }, this);
  },

  fetch: function () {
    var m = this.get('query')
      ? this._tableQueryModel
      : this._originalTableModel;

    // Pass through any arguments as-is
    m.fetch.apply(m, arguments);
  },

  _onOriginalTableModelSync: function () {
    this._changeModels(this._originalTableModel.columnsCollection.models);
  },

  _onTableQuerySync: function () {
    this._changeModels(this._tableQueryModel.columnsCollection.models);
  },

  _changeModels: function (models) {
    this.columnsCollection.reset(models);
    this.set('fetched', true);
  }

});
