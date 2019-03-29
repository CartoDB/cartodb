var CoreView = require('backbone/core-view');
var TipsyTooltipView = require('../../../builder/components/tipsy-tooltip-view');
var template = require('./histogram-title-template.tpl');

/**
 *  Show title + show if histogram sizes are applied or not
 *
 */

module.exports = CoreView.extend({
  className: 'CDB-Widget-title CDB-Widget-contentSpaced',

  events: {
    'click .js-autoStyle': '_autoStyle',
    'click .js-cancelAutoStyle': '_cancelAutoStyle'
  },

  initialize: function (opts) {
    if (!opts.widgetModel) throw new Error('widgetModel is required');
    if (!opts.dataviewModel) throw new Error('dataviewModel is required');
    if (!opts.layerModel) throw new Error('layerModel is required');

    this.widgetModel = opts.widgetModel;
    this.dataviewModel = opts.dataviewModel;
    this._layerModel = opts.layerModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        title: this.widgetModel.get('title'),
        isAutoStyleEnabled: this._isAutoStyleButtonVisible(),
        isAutoStyle: this.widgetModel.get('autoStyle'),
        isCollapsed: this.widgetModel.get('collapsed')
      })
    );
    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.widgetModel.bind('change:title change:collapsed change:autoStyle change:style', this.render, this);
    this.add_related_model(this.widgetModel);

    this._layerModel.bind('change:visible change:cartocss', this.render, this);
    this.add_related_model(this._layerModel);
  },

  _initViews: function () {
    var sizesTooltip = new TipsyTooltipView({
      el: this.$el.find('.js-sizes'),
      gravity: 'auto'
    });
    this.addView(sizesTooltip);

    var actionsTooltip = new TipsyTooltipView({
      el: this.$el.find('.js-actions'),
      gravity: 'auto'
    });
    this.addView(actionsTooltip);
  },

  _isAutoStyleButtonVisible: function () {
    var layerModelMeta = this._layerModel.get('meta');
    var cartocss = this._layerModel.get('cartocss') || (layerModelMeta && layerModelMeta.cartocss);
    var hasColorsAutoStyle = cartocss && this.widgetModel.hasColorsAutoStyle();

    return this.widgetModel.isAutoStyleEnabled() &&
      this._layerModel.get('visible') &&
      hasColorsAutoStyle;
  },

  _autoStyle: function () {
    this.widgetModel.autoStyle();
  },

  _cancelAutoStyle: function () {
    this.widgetModel.cancelAutoStyle();
  }

});
