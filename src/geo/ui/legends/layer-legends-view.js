var _ = require('underscore');
var View = require('../../../core/view');
var template = require('./layer-legends-template.tpl');
var LegendViewFactory = require('./legend-view-factory');

var LayerLegendsView = View.extend({

  className: 'CDB-LayerLegends js-layer-legends',

  events: {
    'click .js-toggle-layer': '_onToggleLayerCheckboxClicked'
  },

  initialize: function (options) {
    this._legendViews = [];

    this.settingsModel = options.settingsModel;

    this.model.on('change:visible', this.render, this);
    this.model.on('change:layer_name', this.render, this);

    this._getLegendModels().forEach(function (legendModel) {
      legendModel.on('change:state', _.debounce(this.render, 150), this);
      legendModel.on('change:visible', _.debounce(this.render, 150), this);
      this.add_related_model(legendModel);
    }, this);

    this.settingsModel.on('change', this.render, this);
    this.add_related_model(this.settingsModel);
  },

  render: function () {
    var showLegends = this._shouldLegendsBeVisible();
    var showLayerSelector = this._shouldLayerSelectorBeVisible();
    var shouldVisible = this._shouldLayerLegendsBeVisible();

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
      this.$el.html('');
    }

    this.trigger('render');

    return this;
  },

  isEmpty: function () {
    return this.$el.html() === '';
  },

  _shouldLegendsBeVisible: function () {
    var showLegends = this.settingsModel.get('showLegends');
    return showLegends && this._isLayerVisible();
  },

  _shouldLayerLegendsBeVisible: function () {
    var showLegends = this.settingsModel.get('showLegends');
    var hasLegends = this.model.legends.hasAnyLegend();
    return this._shouldLayerSelectorBeVisible() || (this._isLayerVisible() && showLegends && hasLegends);
  },

  _shouldLayerSelectorBeVisible: function () {
    var isLayerSelectorEnabled = this.settingsModel.get('layerSelectorEnabled');
    var showLayerSelector = this.settingsModel.get('showLayerSelector');
    var shouldVisible = showLayerSelector && isLayerSelectorEnabled;

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

  _getLegendViews: function () {
    return this._legendViews || [];
  },

  _getLegendModels: function () {
    return [
      this.model.legends.custom,
      this.model.legends.choropleth,
      this.model.legends.custom_choropleth,
      this.model.legends.category,
      this.model.legends.bubble
    ];
  },

  _isLayerVisible: function () {
    return this.model.isVisible();
  }
});

module.exports = LayerLegendsView;
