var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

var BLACKLISTED_COLUMNS = ['created_at', 'the_geom', 'the_geom_webmercator', 'updated_at'];
var STATS_TYPES = ['category', 'formula', 'histogram'];

module.exports = CoreView.extend({
  className: 'Editor-dataContent',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._modals = opts.modals;

    this.collection = new Backbone.Collection();
  },

  _initBinds: function () {
    this._querySchemaModel.columnsCollection.on('add remove', this._getColumns, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderStats();
    return this;
  },

  _renderStats: function () {
    var self = this;
    if (this._querySchemaModel.get('status') !== 'fetched') {
      this._querySchemaModel.fetch({
        success: self._getColumns.bind(self)
      });
    } else {
      this._renderSubset();
    }
  },

  _renderSubset: function () {
    console.log(this._columns);
  },

  _getColumns: function () {
    this._columns = _.without(this._querySchemaModel.columnsCollection.pluck('name'), BLACKLISTED_COLUMNS);
    this._table = this._layerDefinitionModel.getTableName();
    this._renderStats();
  }
});
