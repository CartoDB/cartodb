var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StatView = require('./stat-view');
var dataNotReadyTemplate = require('./data-content-not-ready.tpl');
var dataErrorTemplate = require('./data-content-error.tpl');
var actionErrorTemplate = require('../../sql-error-action.tpl');
var QuerySanity = require('../../query-sanity-check');
var OverlayView = require('../../../components/overlay/overlay-view');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var STATES = {
  ready: 'ready',
  loading: 'loading',
  nogeometry: 'no-geometry',
  error: 'error'
};

var REQUIRED_OPTS = [
  'columnsModel',
  'infoboxModel',
  'overlayModel',
  'queryGeometryModel',
  'querySchemaModel',
  'stackLayoutModel',
  'userActions',
  'widgetDefinitionsCollection'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._columnsCollection = this._columnsModel.getCollection();

    this.modelView = new Backbone.Model({
      state: this._getInitialState(),
      renderLoading: true
    });

    this._initBinds();
    QuerySanity.track(this, this.render.bind(this));
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._hasError()) {
      this._showError();
    } else if (this._hasNoGeometryData()) {
      this._showNoGeometryData();
    } else if (this._isLoading()) {
      this._showLoading();
    } else if (this._isReady()) {
      this._renderStats();
    }

    this._renderOverlay();
    return this;
  },

  _renderOverlay: function () {
    var view = new OverlayView({
      overlayModel: this._overlayModel
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _showLoading: function () {
    this.$el.empty();
    this.$el.append(
      dataNotReadyTemplate({
        renderLoading: this.modelView.get('renderLoading')
      })
    );
  },

  _showError: function () {
    this.$el.append(
      dataErrorTemplate({
        body: _t('editor.error-query.body', {
          action: actionErrorTemplate({
            label: _t('editor.error-query.label')
          })
        })
      })
    );
  },

  _showNoGeometryData: function () {
    this.$el.append(
      dataErrorTemplate({
        body: _t('editor.data.no-geometry-data')
      })
    );
  },

  _getInitialState: function () {
    return this._columnsReady() ? STATES.ready : STATES.loading;
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

  _hasNoGeometryData: function () {
    return this.modelView.get('state') === STATES.nogeometry;
  },

  _initBinds: function () {
    this.listenTo(this.modelView, 'change:state', this.render);
    this.listenTo(this._queryGeometryModel, 'change:status', this._checkGeometry);
    this.listenTo(this._queryGeometryModel, 'change:simple_geom', this.render);
    this.listenTo(this._columnsModel, 'change:render', this._handleStats);
    this.listenTo(this._columnsCollection, 'change:selected', this._handleWidget);
  },

  _checkGeometry: function (m, status) {
    var hasGeometryData;
    if (status === 'fetched') {
      hasGeometryData = this._queryGeometryModel.hasValue();
      !hasGeometryData && this.modelView.set({state: STATES.nogeometry});
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

  _handleStats: function () {
    if (this._columnsReady()) {
      // we force render because the state could be ready already
      this.modelView.set({
        state: STATES.ready,
        renderLoading: true
      }, {
        silent: true
      });
      this.render();
    } else {
      // if there are not stats, we hide loading and show placeholder
      this.modelView.set({
        state: STATES.loading,
        renderLoading: false
      });
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
      this._infoboxModel.set({
        state: 'no-data',
        renderLoading: false
      });
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
