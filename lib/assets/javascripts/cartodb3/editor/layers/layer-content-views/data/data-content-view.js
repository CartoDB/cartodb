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
    if (!opts.moreStatsModel) throw new Error('moreStatsModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._modals = opts.modals;
    this._moreStatsModel = opts.moreStatsModel;

    this._statsCollection = new Backbone.Collection({
      model: StatModel
    });

    this._initBinds();
  },

  _initBinds: function () {
    this._moreStatsModel.on('change:shown', this._onStatReady, this);
    this.add_related_model(this._moreStatsModel);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderStats();
    return this;
  },

  _renderStats: function () {
    var self = this;

    this._moreStatsModel.set({
      total: 0,
      shown: 0,
      visible: false
    });

    if (this._querySchemaModel.get('status') !== 'fetched') {
      this._statsCollection.reset();
      this._querySchemaModel.fetch({
        success: self._getColumns.bind(self)
      });
    } else {
      this._getColumns();
    }
  },

  _renderRamdom: function () {
    var self = this;

    this._totalStats = this._statsCollection.length;
    this._readyStats = 0;

    this._statsCollection.forEach(function (stat) {
      var view = new StatView({
        moreStatsModel: this._moreStatsModel,
        type: stat.get('type'),
        stat: stat.get('stat'),
        column: stat.get('column'),
        table: self._table
      });
      this.addView(view);
      this.$el.append(view.render().el);
    }, this);
  },

  _onStatReady: function () {
    if (this._totalStats === this._moreStatsModel.get('total')) {
      this._moreStatsModel.set({visible: true});
    }
  },

  _getColumns: function () {
    var self = this;

    this._columns = this._querySchemaModel.columnsCollection;
    this._table = this._layerDefinitionModel.getTableName();
    var data = [];

    this._columns.forEach(function (column) {
      if (_.indexOf(BLACKLISTED_COLUMNS, column.get('name')) < 0) {
        _.each(STATS_TYPES, function (stat) {
          data.push({
            column: column.get('name'),
            type: column.get('type'),
            stat: stat
          });
        });
      }
    });

    self._statsCollection.reset(_.shuffle(data));
    this._renderRamdom();
  }
});
