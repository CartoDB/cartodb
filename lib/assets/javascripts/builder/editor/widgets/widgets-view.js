var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var EditorWidgetView = require('./widget-view');
var template = require('./widgets-view.tpl');
var widgetPlaceholderTemplate = require('./widgets-placeholder.tpl');
var widgetsErrorTemplate = require('./widgets-content-error.tpl');
var widgetsNotReadyTemplate = require('./widgets-content-not-ready.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var AddWidgetsView = require('builder/components/modals/add-widgets/add-widgets-view');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

require('jquery-ui');

var STATES = {
  loading: 'loading',
  ready: 'ready'
};

var REQUIRED_OPTS = [
  'userActions',
  'analysisDefinitionNodesCollection',
  'layerDefinitionsCollection',
  'widgetDefinitionsCollection',
  'userModel',
  'stackLayoutModel',
  'configModel',
  'modals'
];

/**
 * View to render widgets definitions overview
 */
module.exports = CoreView.extend({

  module: 'editor:widgets:widgets-view',

  events: {
    'click .js-add': '_addWidget'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.viewModel = new Backbone.Model({
      state: STATES.loading
    });

    this._initViewState();
    this._initBinds();

    var callback = this._onAllQueryGeometryLoaded.bind(this);
    this._layerDefinitionsCollection.loadAllQueryGeometryModels(callback);
  },

  render: function () {
    this._destroySortable();
    this.clearSubViews();
    this.$el.empty();

    this._initViews();

    return this;
  },

  _initViewState: function () {
    this._viewState = new Backbone.Model({
      anyGeometryData: true
    });

    this._setViewState();
  },

  _initViews: function () {
    if (this._isLoading()) {
      this.$el.append(widgetsNotReadyTemplate());
      return;
    }

    if (!this._viewState.get('anyGeometryData')) {
      this._showNoGeometryData();
      return;
    }

    if (this._widgetDefinitionsCollection.size() > 0) {
      this.$el.append(template);
      _.each(this._widgetDefinitionsCollection.sortBy('order'), this._addWidgetItem, this);
      this._initSortable();
      this._addTooltip();
      return;
    }

    this.$el.append(widgetPlaceholderTemplate());
    this._addTooltip();
  },

  _initBinds: function () {
    this.listenTo(this._widgetDefinitionsCollection, 'destroy successAdd', this.render, this);
    this.listenTo(this.viewModel, 'change:state', this.render, this);
    this.listenTo(this._viewState, 'change', this.render);
  },

  _showNoGeometryData: function () {
    this.$el.append(
      widgetsErrorTemplate({
        body: _t('editor.widgets.no-geometry-data')
      })
    );
  },

  _onAllQueryGeometryLoaded: function () {
    this.viewModel.set('state', STATES.ready);
  },

  _addTooltip: function () {
    var tooltip = new TipsyTooltipView({
      el: this.$('.js-add'),
      gravity: 'w',
      title: function () {
        return _t('editor.widgets.add-widget.tooltip');
      },
      offset: 8
    });

    this.addView(tooltip);
  },

  _isLoading: function () {
    return this.viewModel.get('state') === STATES.loading;
  },

  _isReady: function () {
    return this.viewModel.get('state') === STATES.ready;
  },

  _setViewState: function () {
    this._layerDefinitionsCollection.isThereAnyGeometryData()
      .then(function (anyGeometry) {
        this._viewState.set('anyGeometryData', anyGeometry);
      }.bind(this));
  },

  _initSortable: function () {
    this.$('.js-widgets').sortable({
      axis: 'y',
      items: '> li.BlockList-item',
      opacity: 0.8,
      update: this._onSortableFinish.bind(this),
      forcePlaceholderSize: false
    }).disableSelection();
  },

  _destroySortable: function () {
    if (this.$('.js-widgets').data('ui-sortable')) {
      this.$('.js-widgets').sortable('destroy');
    }
  },

  _onSortableFinish: function () {
    var self = this;
    this.$('.js-widgets > .js-widgetItem').each(function (index, item) {
      var modelCid = $(item).data('model-cid');
      var widgetDefModel = self._widgetDefinitionsCollection.get(modelCid);
      widgetDefModel.set('order', index);
      self._userActions.saveWidget(widgetDefModel);
    });
  },

  _addWidget: function () {
    if (this.$('.js-add').hasClass('is-disabled')) return;

    var self = this;

    this._modals.create(function (modalModel) {
      return new AddWidgetsView({
        modalModel: modalModel,
        userModel: self._userModel,
        userActions: self._userActions,
        configModel: self._configModel,
        analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
        layerDefinitionsCollection: self._layerDefinitionsCollection,
        widgetDefinitionsCollection: self._widgetDefinitionsCollection
      });
    }, {
      breadcrumbsEnabled: true
    });
  },

  _addWidgetItem: function (model) {
    var view = new EditorWidgetView({
      model: model,
      layer: this._layerDefinitionsCollection.get(model.get('layer_id')),
      modals: this._modals,
      userActions: this._userActions,
      stackLayoutModel: this._stackLayoutModel
    });
    this.addView(view);
    this.$('.js-widgets').append(view.render().el);
  },

  clean: function () {
    this._destroySortable();
    CoreView.prototype.clean.apply(this);
  }
});
