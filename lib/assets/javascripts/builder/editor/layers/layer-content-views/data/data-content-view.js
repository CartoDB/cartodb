var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StatView = require('./stat-view');
var dataNotReadyTemplate = require('./data-content-not-ready.tpl');
var dataErrorTemplate = require('./data-content-error.tpl');
var dataNoGeometryTemplate = require('./data-content-nogeometry.tpl');
var layerTabMessageTemplate = require('builder/editor/layers/layer-tab-message.tpl');
var actionErrorTemplate = require('builder/editor/layers/sql-error-action.tpl');
var addFeaturePointIcon = require('builder/components/icon/templates/add-feature-point.tpl');
var addFeatureLineIcon = require('builder/components/icon/templates/add-feature-line.tpl');
var addFeaturePolygonIcon = require('builder/components/icon/templates/add-feature-polygon.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var STATES = require('builder/data/query-base-status');

var REQUIRED_OPTS = [
  'columnsModel',
  'infoboxModel',
  'overlayModel',
  'queryGeometryModel',
  'stackLayoutModel',
  'userActions',
  'layerContentModel',
  'layerDefinitionModel'
];

module.exports = CoreView.extend({
  module: 'editor/layers/layer-content-views/data/data-content-view',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initViewState();
    this._initModels();
    this._initBinds();
  },

  _initViewState: function () {
    this._viewState = new Backbone.Model({
      hasGeom: true,
      isDataFiltered: false,
      canBeGeoreferenced: false
    });

    this._setViewState();
  },

  _initModels: function () {
    this._columnsCollection = this._columnsModel.getCollection();

    this.model = new Backbone.Model({
      renderLoading: true
    });
  },

  _initBinds: function () {
    this.listenTo(this._layerContentModel, 'change:state', this._setViewState);
    this.listenTo(this._columnsModel, 'change:render', this._handleStats);
    this.listenTo(this._columnsCollection, 'change:selected', this._handleWidget);
    this.listenTo(this._overlayModel, 'change:visible', this._toggleOverlay);
    this.listenTo(this._viewState, 'change', this.render);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._isErrored()) {
      this._showError();
    } else if (this._viewState.get('isDataFiltered')) {
      this._showFilteredData();
    } else if (this._viewState.get('canBeGeoreferenced')) {
      this._showGeocodeMessage();
    } else if (!this._viewState.get('hasGeom')) {
      this._showNoGeometryData();
    } else {
      this._renderStats();
    }

    this._toggleOverlay();
    return this;
  },

  _toggleOverlay: function () {
    var isDisabled = this._overlayModel.get('visible');
    this.$el.toggleClass('is-disabled', isDisabled);
  },

  _showLoading: function () {
    this.$el.empty();
    this.$el.append(
      dataNotReadyTemplate({
        renderLoading: this._layerContentModel.get('renderLoading')
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
      dataNoGeometryTemplate({
        message: _t('editor.data.no-geometry-data.message'),
        action: _t('editor.data.no-geometry-data.action-message', {
          pointIcon: addFeaturePointIcon(),
          lineIcon: addFeatureLineIcon(),
          polygonIcon: addFeaturePolygonIcon()
        })
      })
    );
  },

  _showFilteredData: function () {
    this.$el.append(
      layerTabMessageTemplate({
        message: _t('editor.layers.warnings.no-data.message'),
        action: _t('editor.layers.warnings.no-data.action-message')
      })
    );
  },

  _showGeocodeMessage: function () {
    this.$el.append(
      layerTabMessageTemplate({
        message: _t('editor.layers.warnings.geocode.message'),
        action: _t('editor.layers.warnings.geocode.action-message')
      })
    );
  },

  _isErrored: function () {
    return this._layerContentModel.isErrored();
  },

  _columnsReady: function () {
    return this._columnsModel.get('render') === true;
  },

  _handleWidget: function (model) {
    model.get('selected') === true
      ? this._addWidget(model)
      : this._destroyWidget(model);
  },

  _addWidget: function (model) {
    var widgetModel = this._columnsModel.findWidget(model);

    widgetModel
      ? model.set({widget: widgetModel})
      : this._saveWidget(model);
  },

  _destroyWidget: function (model) {
    var widgetModel = model.get('widget');
    widgetModel && widgetModel.destroy();
  },

  _saveWidget: function (model) {
    var self = this;
    var widgetModel;

    this._userActions.saveWidgetOption(model)
      .then(function (newWidgetModel) {
        widgetModel = newWidgetModel;

        model.set({widget: widgetModel});

        if (model.get('type') === 'time-series') {
          self._normalizeTimeSeriesColumn(model);
        }

        return self._userActions.updateWidgetsOrder(model);
      })
      .then(function () {
        self.render();
      });
  },

  _normalizeTimeSeriesColumn: function (lastModel) {
    var existingDefModel = this._columnsCollection.findWhere(function (model) {
      return model.get('type') === 'time-series' && model.get('selected') === true && model.cid !== lastModel.cid;
    });

    existingDefModel && existingDefModel.set({
      selected: false,
      widget: null
    });
  },

  _handleStats: function () {
    if (this._columnsReady()) {
      // we force render because the state could be ready already
      this._layerContentModel.set({
        state: STATES.fetched,
        renderLoading: true
      }, {
        silent: true
      });
      this.render();
    } else {
      // if there are not stats, we hide loading and show placeholder
      this._layerContentModel.set({
        state: STATES.fetching,
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
  },

  _setViewState: function () {
    var self = this;
    var hasGeomPromise = this._queryGeometryModel.hasValueAsync();
    var isDataFilteredPromise = this._layerDefinitionModel.isDataFiltered();
    var geoReferencePromise = this._layerDefinitionModel.canBeGeoreferenced();

    Promise.all([hasGeomPromise, isDataFilteredPromise, geoReferencePromise])
      .then(function (values) {
        self._viewState.set({
          hasGeom: values[0],
          isDataFiltered: values[1],
          canBeGeoreferenced: values[2]
        });
      });
  }
});
