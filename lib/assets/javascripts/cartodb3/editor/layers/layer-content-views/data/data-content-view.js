var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StatView = require('./stat-view');
var StatModel = require('./stat-model');

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

    this._statsCollection = new Backbone.Collection({
      model: StatModel
    });
  },

  _initBinds: function () {
    this._querySchemaModel.columnsCollection.on('add remove', this._getColumns, this);
    this.add_related_model(this._querySchemaModel.columnsCollection);
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
      this._getColumns();
    }
  },

  _renderRamdom: function () {
    var self = this;

    this._shuffle();

    this._statsCollection.forEach(function (stat) {
      var view = new StatView({
        type: stat.get('type'),
        column: stat.get('column'),
        table: self._table
      });
      this.addView(view);
      this.$el.append(view.render().el);
    }, this);
  },

  _shuffle: function () {
    return this._statsCollection.reset(this._statsCollection.shuffle());
  },

  _getColumns: function () {
    var self = this;
    this._statsCollection.reset();
    this._columns = _.difference(this._querySchemaModel.columnsCollection.pluck('name'), BLACKLISTED_COLUMNS);
    this._table = this._layerDefinitionModel.getTableName();

    _.each(this._columns, function (column) {
      _.each(STATS_TYPES, function (type) {
        self._statsCollection.add({
          column: column,
          type: type
        });
      });
    });

    this._renderRamdom();
  }
});
