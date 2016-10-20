var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Ps = require('perfect-scrollbar');
var template = require('./legends-view.tpl');
var LayerLegendsView = require('./layer-legends-view');

var LegendsView = Backbone.View.extend({

  className: 'CDB-Legends-canvas',

  initialize: function (options) {
    if (!options.layersCollection) throw new Error('layersCollection is required');
    this._layersCollection = options.layersCollection;

    this._isRendered = false;
    this.settingsModel = options.settingsModel;
    this._initBinds();
  },

  _initBinds: function () {
    this._layersCollection.on('add remove', this._onLayerAddedOrRemoved, this);
    this.settingsModel.on('change', this._onSettingsModelChanged, this);
  },

  render: function () {
    this.$el.html(template());
    var layerModelsWithLegends = this._layersCollection.getLayersWithLegends();
    _.each(layerModelsWithLegends.reverse(), this._renderLayerLegends, this);
    this._isRendered = true;
    this._renderScroll();
    this._renderShadows();
    this._bindScroll();

    return this;
  },

  _renderScroll: function () {
    Ps.initialize(this._container(), {
      wheelSpeed: 1,
      wheelPropagation: false,
      swipePropagation: true,
      stopPropagationOnClick: false,
      minScrollbarLength: 20
    });
  },

  _renderShadows: function () {
    this.$shadowTop = $('<div>').addClass('CDB-Legends-canvasShadow CDB-Legends-canvasShadow--top');
    this.$shadowBottom = $('<div>').addClass('CDB-Legends-canvasShadow CDB-Legends-canvasShadow--bottom');
    this.$el.append(this.$shadowTop);
    this.$el.append(this.$shadowBottom);
    _.defer(function () {
      this._showOrHideShadows();
    }.bind(this));
  },

  _bindScroll: function () {
    this.$(this._container())
      .on('ps-y-reach-start', _.bind(this._onScrollTop, this))
      .on('ps-y-reach-end', _.bind(this._onScrollBottom, this))
      .on('ps-scroll-y', _.bind(this._onScroll, this));
  },

  _onScrollTop: function () {
    this.$shadowTop.removeClass('is-visible');
  },

  _onScroll: function () {
    this._showOrHideShadows();
  },

  _showOrHideShadows: function () {
    var $el = $(this._container());
    var currentPos = $el.scrollTop();
    var max = $el.get(0).scrollHeight;
    var height = $el.outerHeight();
    var maxPos = max - height;

    this.$shadowTop.toggleClass('is-visible', currentPos > 0);
    this.$shadowBottom.toggleClass('is-visible', currentPos < maxPos);
  },

  _onScrollBottom: function () {
    this.$shadowBottom.removeClass('is-visible');
  },

  _container: function () {
    return this.el.querySelector('.js-container');
  },

  _renderLayerLegends: function (layerModel) {
    var layerLegendsView = new LayerLegendsView({
      model: layerModel,
      settingsModel: this.settingsModel,
      tryContainerVisibility: this._tryVisibility.bind(this)
    });

    this.$(this._container()).append(layerLegendsView.render().$el);
  },

  _onLayerAddedOrRemoved: function (layerModel) {
    // If view has already been rendered and a layer is added / removed
    if (this._isRendered && this._hasLegends(layerModel)) {
      this._clear();
      this.render();
    }
  },

  _tryVisibility: function () {
    var shouldHide = !_.every(this.$('.js-layer-legends'), function (el) {
      return $(el).is(':empty');
    });

    this.$el.toggle(shouldHide);
  },

  _hasLegends: function (layerModel) {
    return !!layerModel.legends;
  },

  _clear: function () {
    this.$el.html('');
  },

  show: function () {
    this.$el.show();
  },

  hide: function () {
    this.$el.hide();
  }
});

module.exports = LegendsView;
