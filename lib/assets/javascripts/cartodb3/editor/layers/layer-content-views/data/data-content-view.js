var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StatView = require('./stat-view');
var dataNotReadyTemplate = require('./data-content-not-ready.tpl');
var dataErrorTemplate = require('./data-content-error.tpl');
var renderLoading = true;

var STATES = {
  ready: 'ready',
  loading: 'loading',
  fetched: 'fetched',
  error: 'error'
};

module.exports = CoreView.extend({
  className: 'Editor-dataContent',

  initialize: function (opts) {
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.columnsModel) throw new Error('columnsModel is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.infoboxModel) throw new Error('infoboxModel is required');
    if (!opts.userActions) throw new Error('userActions is required');

    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;

    this._stackLayoutModel = opts.stackLayoutModel;
    this._infoboxModel = opts.infoboxModel;
    this._columnsModel = opts.columnsModel;
    this._columnsCollection = this._columnsModel.getCollection();
    this._userActions = opts.userActions;
    this._querySchemaModel = opts.querySchemaModel;

    this.modelView = new Backbone.Model({
      state: STATES.loading
    });

    this._initBinds();
    this._showErrors();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._hasError()) {
      this._showError();
    } else if (this._isLoading()) {
      this._showLoading();
    } else if (this._isReady()) {
      if (this._columnsReady()) {
        this._renderStats();
      } else {
        this._showLoading();
      }
    }

    return this;
  },

  _showLoading: function () {
    this.$el.empty();
    this.$el.append(
      dataNotReadyTemplate({
        renderLoading: renderLoading
      })
    );
  },

  _showError: function () {
    this.$el.empty();
    this.$el.append(
      dataErrorTemplate()
    );
  },

  _hasError: function () {
    return this.modelView.get('state') === STATES.error;
  },

  _isLoading: function () {
    return this.modelView.get('state') === STATES.loading;
  },

  _isReady: function () {
    return this.modelView.get('state') === STATES.ready;
  },

  _columnsReady: function () {
    return this._columnsModel.get('render') === true;
  },

  _initBinds: function () {
    this._columnsModel.on('change:render', this._renderStats, this);
    this.add_related_model(this._columnsModel);

    this._columnsCollection.on('change:selected', this._handleWidget, this);
    this.add_related_model(this._columnsCollection);

    this._querySchemaModel.on('change:status', this._onQuerySchemaStatusChange, this);
    this._querySchemaModel.on('change:query_errors', this._showErrors, this);
    this.add_related_model(this._querySchemaModel);

    this.modelView.on('change:state', this.render, this);
    this.add_related_model(this.modelView);
  },

  _onQuerySchemaStatusChange: function () {
    this._hasFetchedQuerySchema() && this.modelView.set({state: STATES.ready});
  },

  _hasFetchedQuerySchema: function () {
    return this._querySchemaModel.get('status') === STATES.fetched;
  },

  _showErrors: function (model) {
    var errors = this._querySchemaModel.get('query_errors');

    if (errors && errors.length > 0) {
      this.modelView.set({state: STATES.error});
    }
  },

  _handleWidget: function (model) {
    var m, candidate;
    if (model.get('selected') === true) {
      candidate = this._columnsModel.findWidget(model);
      if (!candidate) {
        m = this._userActions.saveWidgetOption(model);
        model.set({widget: m});

        // uncheck previous date column
        if (model.get('type') === 'time-series') {
          this._normalizeTimeSeriesColumn(model);
        }
      } else {
        model.set({widget: candidate});
      }
    } else {
      m = model.get('widget');
      m && m.destroy();
    }
  },

  _normalizeTimeSeriesColumn: function (lastModel) {
    var existingDefModel = this._columnsCollection.findWhere(function (m) {
      return m.get('type') === 'time-series' && m.get('selected') === true && m.cid !== lastModel.cid;
    });

    existingDefModel && existingDefModel.set({
      selected: false,
      widget: null
    });
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
      renderLoading = false;
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
