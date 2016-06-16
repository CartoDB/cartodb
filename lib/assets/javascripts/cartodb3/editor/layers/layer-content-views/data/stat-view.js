var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var TableStats = require('../../../../components/modals/add-widgets/tablestats');
var template = require('./stat.tpl');
var templateCategory = require('./stat-category.tpl');
var templateHistogram = require('./stat-histogram.tpl');
var templateFormula = require('./stat-formula.tpl');

module.exports = CoreView.extend({
  className: 'StatsList is-hidden',
  initialize: function (opts) {
    if (!opts.column) throw new Error('column is required');
    if (!opts.table) throw new Error('table is required');
    if (!opts.type) throw new Error('type is required');
    if (!opts.stat) throw new Error('stat is required');
    if (!opts.moreStatsModel) throw new Error('moreStatsModel is required');

    this._table = opts.table;
    this._column = opts.column;
    this._type = opts.type;
    this._statType = opts.stat;
    this._moreStatsModel = opts.moreStatsModel;

    this.model = new Backbone.Model({
      checked: false,
      graph: null
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  show: function () {
    this.$el.removeClass('is-hidden');
  },

  _initBinds: function () {
    this.model.on('change:checked', this._handleWidget, this);
    this.model.on('change:graph', this._showStat, this);
  },

  _initViews: function () {
    var self = this;
    var ts = new TableStats();
    ts.graphFor(self._table, self._column, function (graph) {
      if (graph.stats) {
        self.model.set({graph: graph});
      }
    });
  },

  _showStat: function () {
    var graph = this.model.get('graph');
    var shown = this._moreStatsModel.get('shown');
    var total = this._moreStatsModel.get('total');
    var limit = this._moreStatsModel.get('limit');

    this._moreStatsModel.set({total: total + 1});

    if (this._statType === 'formula') {
      this._showFormula(graph, shown, limit);
    } else if (this._statType === 'histogram') {
      this._showHistogram(graph, shown, limit);
    } else if (this._statType === 'category') {
      this._showCategory(graph, shown, limit);
    }
  },

  _renderTemplate: function () {
    this.$el.append(template({
      column: this._column,
      type: this._type
    }));
  },

  _showFormula: function (graph, shown, limit) {
    if (graph.stats && !isNaN(graph.stats.avg) && graph.stats.nulls !== undefined) {
      this._renderTemplate();
      this.$('.js-stat').append(templateFormula());
      this.$('.js-formula-numbers').text(graph.getNullsPercentage() + '% null');
      this.$('.js-formula-stat').text(graph.getAverage().toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
      this._moreStatsModel.set({shown: shown + 1});
      (shown < limit) && this.$el.removeClass('is-hidden');
    }
  },

  _showCategory: function (graph, shown, limit) {
    if (graph.stats && graph.stats.freqs) {
      this._renderTemplate();
      this.$('.js-stat').append(templateCategory());
      this.$('.js-category-stat').append(graph.getCategory({
        color: '#9DE0AD',
        width: 262,
        height: 10
      }));

      this.$('.js-null').text(graph.getNullsPercentage() + '% null');
      this.$('.js-percent').text((graph.getPercentageInTopCategories() * 100).toFixed(2) + '% in top 10 cat.');
      this._moreStatsModel.set({shown: shown + 1});
      (shown < limit) && this.$el.removeClass('is-hidden');
    }
  },

  _showHistogram: function (graph, shown, limit) {
    if (graph.stats && graph.stats.nulls != null && graph.stats.histogram_bounds != null) {
      this._renderTemplate();
      this.$('.js-stat').append(templateHistogram());
      this.$('.js-histogram-stat').append(graph.getHistogram({
        color: '#9DE0AD',
        width: 262,
        height: 20,
        bins: 20
      }));
      this.$('.js-histogram-numbers').text(graph.getNullsPercentage() + '% null');
      this._moreStatsModel.set({shown: shown + 1});
      (shown < limit) && this.$el.removeClass('is-hidden');
    }
  }
});
