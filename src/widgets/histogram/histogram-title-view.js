var $ = require('jquery');
var cdb = require('cartodb.js');
var TooltipView = require('../widget-tooltip-view');
var template = require('./histogram-title-template.tpl');

/**
 *  Show title + show if histogram sizes are applied or not
 *
 */

module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-title CDB-Widget-contentSpaced',

  events: {
    'click .js-applySizes': '_applySizes',
    'click .js-cancelSizes': '_cancelSizes'
  },

  initialize: function () {
    this.widgetModel = this.options.widgetModel;
    this.dataviewModel = this.options.dataviewModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        title: this.widgetModel.get('title'),
        isSizesApplied: this.dataviewModel.get('histogramSizes'),
        isCollapsed: this.widgetModel.get('collapsed')
      })
    );
    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.widgetModel.bind('change:title change:collapsed', this.render, this);
    this.dataviewModel.bind('change:histogramSizes', this.render, this);
    this.add_related_model(this.dataviewModel);
  },

  _initViews: function () {
    var sizesTooltip = new TooltipView({
      target: this.$('.js-sizes')
    });
    $('body').append(sizesTooltip.render().el);
    this.addView(sizesTooltip);
  },

  _applySizes: function () {
    this.dataviewModel.set('histogramSizes', true);
  },

  _cancelSizes: function () {
    this.dataviewModel.set('histogramSizes', false);
  }

});
