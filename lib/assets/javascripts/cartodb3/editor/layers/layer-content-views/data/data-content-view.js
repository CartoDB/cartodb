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
        stat: stat.get('stat'),
        column: stat.get('column'),
        table: self._table
      });
      this.addView(view);
      this.$el.append(view.render().el);

      self.listenToOnce(view, 'stat:ready', self._onStatReady);
    }, this);
  },

  _onStatReady: function (view, ready) {
    var limit = 5;
    this._totalStats--;

    if (ready) {
      this._readyStats++;
      (this._readyStats <= limit) && view.show();
    }

    if (this._totalStats === 0) {
      console.log('Tira...', this._readyStats - limit);
    }
  },

  _shuffle: function () {
    return this._statsCollection.reset(this._statsCollection.shuffle());
  },

  _getColumns: function () {
    var self = this;
    this._statsCollection.reset();

    this._columns = this._querySchemaModel.columnsCollection;
    this._table = this._layerDefinitionModel.getTableName();

    this._columns.forEach(function (column) {
      if (_.indexOf(BLACKLISTED_COLUMNS, column.get('name')) < 0) {
        _.each(STATS_TYPES, function (stat) {
          self._statsCollection.add({
            column: column.get('name'),
            type: column.get('type'),
            stat: stat
          });
        });
      }
    });

    this._totalStats = this._statsCollection.length;
    this._readyStats = 0;

    this._renderRamdom();
  }
});
