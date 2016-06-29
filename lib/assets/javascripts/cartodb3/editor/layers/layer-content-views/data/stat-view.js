var CoreView = require('backbone/core-view');
var template = require('./stat.tpl');
var templateCategory = require('./stat-category.tpl');
var templateHistogram = require('./stat-histogram.tpl');

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
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
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
      }
    }
  },

  _renderTemplate: function () {
    this.$el.append(template({
      column: this._statModel.get('name'),
      type: this._statModel.get('column'),
      graph: this._statModel.get('type'),
      isSelected: this._statModel.get('selected')
    }));
  },

  _onSelect: function () {
    this._statModel.set('selected', !this._statModel.get('selected'));
    this.$('.js-style').toggleClass('is-hidden');
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

      this.$('.js-null').text(graph.getNullsPercentage() + _t('editor.data.stats.null'));
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
  }
});
