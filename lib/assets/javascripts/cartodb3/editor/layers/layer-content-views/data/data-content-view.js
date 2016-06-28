var _ = require('underscore');
var CoreView = require('backbone/core-view');
var StatView = require('./stat-view');
var dataNotReadyTemplate = require('./data-content-not-ready.tpl');

module.exports = CoreView.extend({
  className: 'Editor-dataContent',

  initialize: function (opts) {
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.columnsModel) throw new Error('columnsModel is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.infoboxModel) throw new Error('infoboxModel is required');

    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;

    this._stackLayoutModel = opts.stackLayoutModel;
    this._infoboxModel = opts.infoboxModel;
    this._columnsModel = opts.columnsModel;
    this._columnsCollection = this._columnsModel.getCollection();

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    if (this._columnsReady()) {
      this._renderStats();
    } else {
      this._showLoading();
    }
    return this;
  },

  _showLoading: function () {
    this.$el.append(
      dataNotReadyTemplate()
    );
  },

  _columnsReady: function () {
    return this._columnsModel.get('render') === true;
  },

  _initBinds: function () {
    this._columnsModel.on('change:render', this._renderStats, this);
    this.add_related_model(this._columnsModel);

    this._columnsCollection.on('change:selected', this._handleWidget, this);
    this.add_related_model(this._columnsCollection);
  },

  _handleWidget: function (model) {
    var m, candidate;
    if (model.get('selected') === true) {
      candidate = this._columnsModel.findWidget(model);
      if (!candidate) {
        m = model.createUpdateOrSimilar(this._widgetDefinitionsCollection);
        model.set({widget: m});
      } else {
        model.set({widget: candidate});
      }
    } else {
      m = model.get('widget');
      m && m.destroy();
    }
  },

  _renderStats: function () {
    if (!this._columnsReady()) {
      return;
    }

    var withWidgetAndGraph = this._columnsModel.getColumnsWithWidgetAndGraph();
    var withWidget = this._columnsModel.getColumnsWithWidget();
    var withGraph = this._columnsModel.getColumnsWithGraph();
    var withoutGraph = this._columnsModel.getColumnsWithoutGraph();
    var all;
    if (withWidgetAndGraph.length === 0 && withWidget.length === 0 &&
        withGraph.length === 0 && withoutGraph.length === 0) {
      this._infoboxModel.set({state: 'no-data'});
      this._showLoading();
    } else {
      this.$el.empty();
      all = _.union(withWidgetAndGraph, withWidget, withGraph, withoutGraph);
      this._renderColumns(all);
    }
  },

  _renderColumns: function (stats) {
    _.each(stats, function (stat, index) {
      var view = new StatView({
        stackLayoutModel: this._stackLayoutModel,
        statModel: stat
      });

      this.addView(view);
      this.$el.append(view.render().el);
    }, this);
  }
});
