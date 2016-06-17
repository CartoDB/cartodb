var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var TableStats = require('../../../../components/modals/add-widgets/tablestats');
var template = require('./stat.tpl');
var templateCategory = require('./stat-category.tpl');
var templateHistogram = require('./stat-histogram.tpl');
var templateFormula = require('./stat-formula.tpl');

module.exports = CoreView.extend({
  className: 'StatsList is-hidden',

  events: {
    'click .js-checkbox': '_onSelect'
  },

  initialize: function (opts) {
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.statModel) throw new Error('statModel is required');
    if (!opts.moreStatsModel) throw new Error('moreStatsModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._statModel = opts.statModel;
    this._moreStatsModel = opts.moreStatsModel;
    this._configModel = opts.configModel;

    this.model = new Backbone.Model({
      graph: null
    });

    this._locateWidget();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _locateWidget: function () {
    var i = this._statModel.get('layer_index');
    var item = this._statModel.get('tuples')[i];
    var type = this._statModel.get('type');
    var column = this._statModel.get('name');
    var model = _.first(this._widgetDefinitionsCollection.where({
      type: type,
      source: item.analysisDefinitionModel.id,
      column: column
    }));

    if (model) {
      this._statModel.set({
        selected: true,
        widget: model
      }, {silent: true});
    }
  },

  show: function () {
    this.$el.removeClass('is-hidden');
  },

  _initBinds: function () {
    this.model.on('change:graph', this._showStat, this);
  },

  _initViews: function () {
    var self = this;
    var ts = new TableStats({
      configModel: this._configModel
    });
    var table = this._statModel.get('table');
    var column = this._statModel.get('name');
    ts.graphFor(table, column, function (graph) {
      if (graph.stats) {
        self.model.set({graph: graph});
      }
    });
  },

  _showStat: function () {
    var graph = this.model.get('graph');
    var shown = this._moreStatsModel.get('shown');
    var limit = this._moreStatsModel.get('limit');
    var type = this._statModel.get('type');

    if (type === 'formula') {
      this._showFormula(graph, shown, limit);
    } else if (type === 'histogram') {
      this._showHistogram(graph, shown, limit);
    } else if (type === 'category') {
      this._showCategory(graph, shown, limit);
    }

    this.trigger('stat:render');
  },

  _renderTemplate: function () {
    this.$el.append(template({
      column: this._statModel.get('name'),
      type: this._statModel.get('type'),
      isSelected: this._statModel.get('selected')
    }));
  },

  _onSelect: function () {
    this._statModel.set('selected', !this._statModel.get('selected'));
  },

  _showFormula: function (graph, shown, limit) {
    if (graph.stats && !isNaN(graph.stats.avg) && graph.stats.nulls !== undefined) {
      this._renderTemplate();
      this.$('.js-stat').append(templateFormula());
      this.$('.js-formula-numbers').text(graph.getNullsPercentage() + _t('editor.data.stats.null'));
      this.$('.js-formula-stat').text(graph.getAverage().toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
      this._moreStatsModel.set({shown: shown + 1});
      (shown + 1 <= limit) && this.$el.removeClass('is-hidden');
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

      this.$('.js-null').text(graph.getNullsPercentage() + _t('editor.data.stats.null'));
      this.$('.js-percent').text((graph.getPercentageInTopCategories() * 100).toFixed(2) + _t('editor.data.stats.top-cat'));
      this._moreStatsModel.set({shown: shown + 1});
      (shown + 1 <= limit) && this.$el.removeClass('is-hidden');
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
      this.$('.js-histogram-numbers').text(graph.getNullsPercentage() + _t('editor.data.stats.null'));
      this._moreStatsModel.set({shown: shown + 1});
      (shown + 1 <= limit) && this.$el.removeClass('is-hidden');
    }
  }
});
