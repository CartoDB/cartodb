var $ = require('jquery');
var _ = require('underscore');
var View = require('../../../core/view');
var Ps = require('perfect-scrollbar');
var template = require('./legends-view.tpl');
var LayerLegendsView = require('./layer-legends-view');

var LegendsView = View.extend({

  className: 'CDB-Legends-canvas',

  initialize: function (options) {
    if (!options.layersCollection) throw new Error('layersCollection is required');
    this._layersCollection = options.layersCollection;

    this._isRendered = false;
    this.settingsModel = options.settingsModel;
    this._initBinds();

    this._layerLegendsViews = [];
  },

  _initBinds: function () {
    this._layersCollection.on('add remove', this._onLayerAddedOrRemoved, this);
    this.add_related_model(this._layersCollection);
    this.settingsModel.on('change', this._onSettingsModelChanged, this);
    this.add_related_model(this.settingsModel);
  },

  render: function () {
    this.$el.html(template());
    var layerModelsWithLegends = this._layersCollection.getLayersWithLegends();
    _.each(layerModelsWithLegends.reverse(), this._renderLayerLegends, this);
    this._isRendered = true;
    this._renderScroll();
    this._renderShadows();
    this._bindScroll();
    this._showOrHide();
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
    if ($el.length) {
      var currentPos = $el.scrollTop();
      var max = $el.get(0).scrollHeight;
      var height = $el.outerHeight();
      var maxPos = max - height;

      this.$shadowTop.toggleClass('is-visible', currentPos > 0);
      this.$shadowBottom.toggleClass('is-visible', currentPos < maxPos);
    }
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
      settingsModel: this.settingsModel
    });

    this._layerLegendsViews.push(layerLegendsView);
    layerLegendsView.on('render', this._showOrHide, this);
    this.addView(layerLegendsView);

    this.$(this._container()).append(layerLegendsView.render().$el);
  },

  _onLayerAddedOrRemoved: function (layerModel) {
    // If view has already been rendered and a layer is added / removed
    if (this._isRendered && this._hasLegends(layerModel)) {
      this._clear();
      this.render();
    }
  },

  _showOrHide: function () {
    this.$el.toggle(this._isAnyLayerLegendViewVisible());
  },

  _isAnyLayerLegendViewVisible: function () {
    return _.any(this._layerLegendsViews, function (layerLegendView) {
      return !layerLegendView.isEmpty();
    });
  },

  _hasLegends: function (layerModel) {
    return !!layerModel.legends;
  },

  _clear: function () {
    _.each(this._layerLegendsViews, function (layerLegendView) {
      layerLegendView.clean();
    });
    this._layerLegendsViews = [];
    this.$el.html('');
  },

  show: function () {
    this.$el.show();
  },

  hide: function () {
    this.$el.hide();
  },

  clean: function () {
    View.prototype.clean.call(this);
    this._clear();
  }
});

module.exports = LegendsView;
