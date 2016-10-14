var _ = require('underscore');
var Backbone = require('backbone');
var template = require('./layer-legends-template.tpl');
var LegendViewFactory = require('./legend-view-factory');

var LayerLegendsView = Backbone.View.extend({

  className: 'CDB-LayerLegends js-layer-legends',

  events: {
    'click .js-toggle-layer': '_onToggleLayerCheckboxClicked'
  },

  initialize: function (options) {
    this._legendViews = [];

    this.settingsModel = options.settingsModel;
    this._isEmbed = options.isEmbed;

    this.tryContainerVisibility = options.tryContainerVisibility;

    this.model.on('change:visible', this._onLayerVisibilityChanged, this);
    this.model.on('change:layer_name', this.render, this);

    this._getLegendModels().forEach(function (model) {
      model.on('change:state', _.debounce(this.render, 150), this);
      model.on('change:visible', _.debounce(this.render, 150), this);
    }, this);

    this.settingsModel.on('change', this.render, this);
  },

  render: function () {
    var showLegends = this.settingsModel.get('showLegends');
    var showLayerSelector = this._shouldLayerSelectorBeVisible();
    var shouldVisible = showLayerSelector || this.model.legends.hasAnyLegend() && showLegends;

    if (shouldVisible) {
      this.$el.html(
        template({
          layerName: this.model.getName(),
          isLayerVisible: this._isLayerVisible(),
          showLegends: showLegends,
          showLayerSelector: showLayerSelector
        })
      );

      this._renderLegends();
    } else {
      this.$el.empty();
    }

    this.tryContainerVisibility();
    return this;
  },

  _shouldLayerSelectorBeVisible: function () {
    var isEmbed = this._isEmbed;
    var isSettingsView = !!this.settingsModel.get('settingsView');
    var showLayerSelector = this.settingsModel.get('showLayerSelector');
    var shouldVisible = showLayerSelector;

    if (!isEmbed) {
      shouldVisible = isSettingsView && showLayerSelector;
    }

    return shouldVisible;
  },

  _renderLegends: function () {
    _.each(this._getLegendModels(), this._renderLegend, this);
  },

  _renderLegend: function (legendModel) {
    var legendView = LegendViewFactory.createLegendView(legendModel);
    this._legendViews.push(legendView);
    this._legendsContainer().append(legendView.render().$el);
  },

  _legendsContainer: function () {
    return this.$('.js-legends');
  },

  _onToggleLayerCheckboxClicked: function (event) {
    var isLayerEnabled = event.target.checked;
    if (isLayerEnabled) {
      this.model.show();
    } else {
      this.model.hide();
    }
  },

  _onLayerVisibilityChanged: function () {
    var toggleLayerCheckbox = this.$('.js-toggle-layer');
    if (this._isLayerVisible()) {
      toggleLayerCheckbox.prop('checked', true);
      this._enable();
    } else {
      toggleLayerCheckbox.prop('checked', false);
      this._disable();
    }
  },

  _enable: function () {
    this.$el.removeClass('is-disabled');
    _.invoke(this._getLegendViews(), 'enable');
  },

  _disable: function () {
    this.$el.addClass('is-disabled');
    _.invoke(this._getLegendViews(), 'disable');
  },

  _getLegendViews: function () {
    return this._legendViews || [];
  },

  _getLegendModels: function () {
    return [
      this.model.legends.custom,
      this.model.legends.html,
      this.model.legends.choropleth,
      this.model.legends.category,
      this.model.legends.bubble
    ];
  },

  _isLayerVisible: function () {
    return this.model.isVisible();
  }
});

module.exports = LayerLegendsView;
