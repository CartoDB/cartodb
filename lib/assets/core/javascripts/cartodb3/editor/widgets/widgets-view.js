var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var EditorWidgetView = require('./widget-view');
var template = require('./widgets-view.tpl');
var widgetPlaceholderTemplate = require('./widgets-placeholder.tpl');
var widgetsErrorTemplate = require('./widgets-content-error.tpl');
var widgetsNotReadyTemplate = require('./widgets-content-not-ready.tpl');
var checkAndBuildOpts = require('../../helpers/required-opts');

require('jquery-ui');

var REQUIRED_OPTS = [
  'userActions',
  'layerDefinitionsCollection',
  'widgetDefinitionsCollection',
  'stackLayoutModel',
  'modals'
];

/**
 * View to render widgets definitions overview
 */
module.exports = CoreView.extend({

  module: 'editor:widgets:widgets-view',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.viewModel = new Backbone.Model({
      state: 'loading'
    });

    this._initBinds();

    var callback = this._onAllQueryGeometryLoaded.bind(this);
    this._layerDefinitionsCollection.loadAllQueryGeometryModels(callback);
  },

  render: function () {
    this._destroySortable();
    this.clearSubViews();
    this.$el.empty();

    if (this._isLoading()) {
      this.$el.append(widgetsNotReadyTemplate());
    } else {
      if (!this._anyGeometryData()) {
        this._showNoGeometryData();
      } else {
        if (this._widgetDefinitionsCollection.size() > 0) {
          this.$el.append(template);
          _.each(this._widgetDefinitionsCollection.sortBy('order'), this._addWidgetItem, this);
          this._initSortable();
        } else {
          this.$el.append(widgetPlaceholderTemplate());
        }
      }
    }

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._widgetDefinitionsCollection, 'add', this._goToWidget, this);
    this.listenTo(this._widgetDefinitionsCollection, 'destroy', this.render, this);

    this.listenTo(this.viewModel, 'change:state', this.render, this);
  },

  _showNoGeometryData: function () {
    this.$el.append(
      widgetsErrorTemplate({
        body: _t('editor.widgets.no-geometry-data')
      })
    );
  },

  _onAllQueryGeometryLoaded: function () {
    this.viewModel.set('state', 'ready');
  },

  _isLoading: function () {
    return this.viewModel.get('state') === 'loading';
  },

  _isReady: function () {
    return this.viewModel.get('state') === 'ready';
  },

  _anyGeometryData: function () {
    return this._layerDefinitionsCollection.isThereAnyGeometryData();
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
    var widgetItems = this.$('.js-widgets > .js-widgetItem');
    widgetItems.each(function (index, item) {
      var modelCid = $(item).data('model-cid');
      var widgetDefModel = self._widgetDefinitionsCollection.get(modelCid);
      widgetDefModel.set('order', widgetItems.length - index - 1);
      self._userActions.saveWidget(widgetDefModel);
    });
  },

  _goToWidget: function (widgetModel) {
    this._stackLayoutModel.nextStep(widgetModel, 'widget-content');
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
    this.$('.js-widgets').prepend(view.render().el);
  },

  clean: function () {
    this._destroySortable();
    CoreView.prototype.clean.apply(this);
  }
});
