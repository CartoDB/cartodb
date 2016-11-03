var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./stat.tpl');
var templateCategory = require('./stat-category.tpl');
var templateHistogram = require('./stat-histogram.tpl');
var templateFormula = require('./stat-formula.tpl');

module.exports = CoreView.extend({
  className: 'StatsList',

  events: {
    'click .js-checkbox': '_onSelect',
    'click .js-style': '_onEdit'
  },

  initialize: function (opts) {
    if (!opts.statModel) throw new Error('statModel is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');

    this._statModel = opts.statModel;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._statModel.on('change:selected', this.render, this);
    this.add_related_model(this._statModel);
  },

  _initViews: function () {
    var graph = this._statModel.get('graph');
    var type = this._statModel.get('type');

    this._renderTemplate();

    if (graph) {
      // No graph for formula
      if (type === 'histogram') {
        this._showHistogram(graph);
      } else if (type === 'category') {
        this._showCategory(graph);
      } else if (type === 'formula') {
        this._showFormula(graph);
      }
    }
  },

  _renderTemplate: function () {
    this.$el.append(template({
      column: this._statModel.get('title'),
      type: this._statModel.get('column'),
      graph: this._statModel.get('type'),
      isSelected: this._statModel.get('selected')
    }));
  },

  _onSelect: function () {
    this._statModel.set('selected', !this._statModel.get('selected'));
  },

  _onEdit: function (e) {
    e.preventDefault();
    this._stackLayoutModel.goToStep(1, this._statModel.get('widget'), 'widget-content');
  },

  _showCategory: function (graph) {
    if (graph.stats && graph.stats.freqs) {
      this.$('.js-stat').append(templateCategory());
      this.$('.js-category-stat').append(graph.getCategory({
        color: '#9DE0AD',
        width: 262,
        height: 10
      }));

      this.$('.js-null').text((graph.getNullsPercentage() * 100).toFixed(2) + _t('editor.data.stats.null'));
      if (this.options.statModel.attributes.column !== 'boolean') {
        this.$('.js-percent').text((graph.getPercentageInTopCategories() * 100).toFixed(2) + _t('editor.data.stats.top-cat'));
      } else {
        this.$('.js-percent').text((graph.getTrues() * 100).toFixed(2) + _t('editor.data.stats.trues'));
      }
    }
  },

  _showHistogram: function (graph) {
    if (graph.stats) {
      this.$('.js-stat').append(templateHistogram());
      this.$('.js-histogram-stat').append(graph.getHistogram({
        color: '#9DE0AD',
        width: 262,
        height: 20,
        bins: 20
      }));
      this.$('.js-histogram-numbers').text(graph.getNullsPercentage() + _t('editor.data.stats.null'));
    }
  },

  _showFormula: function (graph) {
    var aggregation;
    if (graph.stats) {
      aggregation = graph.getCount();
      if (_.isNumber(aggregation)) {
        this.$('.js-stat').append(templateFormula());
        this.$('.js-formula-stat').text(aggregation.toFixed().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
      }
    }
  }
});
