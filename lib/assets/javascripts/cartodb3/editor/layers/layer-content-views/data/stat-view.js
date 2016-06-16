var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var TableStats = require('../../../../components/modals/add-widgets/tablestats');
var template = require('./stat.tpl');
var templateCategory = require('./stat-category.tpl');
var templateHistogram = require('./stat-histogram.tpl');
var templateFormula = require('./stat-formula.tpl');

module.exports = CoreView.extend({
  className: 'WidgetList-item',
  initialize: function (opts) {
    if (!opts.column) throw new Error('column is required');
    if (!opts.table) throw new Error('table is required');
    if (!opts.type) throw new Error('type is required');

    this._table = opts.table;
    this._column = opts.column;
    this._type = opts.type;

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
    if (this._type === 'formula') {
      this._showFormula();
    } else if (this._type === 'histogram') {
      this._showHistogram();
    } else if (this._type === 'category') {
      this._showCategory();
    }
  },

  _renderTemplate: function () {
    this.$el.append(template({
      column: this._column
    }));
  },

  _showFormula: function () {
    var graph = this.model.get('graph');

    if (graph.stats && !isNaN(graph.stats.avg) && graph.stats.nulls !== undefined) {
      this._renderTemplate();
      this.$('.js-stat').append(templateFormula());
      this.$('.js-formula-numbers').text(graph.getNullsPercentage() + '% null');
      this.$('.js-formula-stat').text(graph.getAverage().toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }
  },

  _showCategory: function () {
    var graph = this.model.get('graph');

    if (graph.stats && graph.stats.freqs) {
      this._renderTemplate();
      this.$('.js-stat').append(templateCategory());
      this.$('.js-category-stat').append(graph.getCategory({
        color: '#9DE0AD',
        width: 240,
        height: 10
      }));

      this.$('.js-null').text(graph.getNullsPercentage() + '% null');
      this.$('.js-percent').text((graph.getPercentageInTopCategories() * 100).toFixed(2) + '% in top 10 cat.');
    }
  },

  _showHistogram: function () {
    var graph = this.model.get('graph');
    if (graph.stats && graph.stats.nulls != null && graph.stats.histogram_bounds != null) {
      this._renderTemplate();
      this.$('.js-stat').append(templateHistogram());
      this.$('.js-histogram-stat').append(graph.getHistogram({
        color: '#9DE0AD',
        width: 240,
        height: 20,
        bins: 20
      }));

      this.$('.js-histogram-numbers').text(graph.getNullsPercentage() + '% null');
    }
  }
});
