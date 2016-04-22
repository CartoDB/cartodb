var $ = require('jquery');
var cdb = require('cartodb.js');
var TooltipView = require('../widget-tooltip-view');
var template = require('./histogram-title-template.tpl');
var AutoStylerFactory = require('../auto-style/factory');

/**
 *  Show title + show if histogram sizes are applied or not
 *
 */

module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-title CDB-Widget-contentSpaced',

  events: {
    'click .js-autoStyle': 'autoStyle',
    'click .js-cancelAutoStyle': 'cancelAutoStyle'
  },

  initialize: function () {
    this.widgetModel = this.options.widgetModel;
    this.dataviewModel = this.options.dataviewModel;
    this.autoStyler = AutoStylerFactory.get(this.dataviewModel);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        title: this.widgetModel.get('title'),
        isAutoStyle: this.dataviewModel.get('autoStyle'),
        isCollapsed: this.widgetModel.get('collapsed')
      })
    );
    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.widgetModel.bind('change:title change:collapsed', this.render, this);
    this.dataviewModel.bind('change:autoStyle', function () {
      this.render();
      this.dataviewModel._onStyleChanged();
    }, this);
    this.add_related_model(this.dataviewModel);
  },

  _initViews: function () {
    var sizesTooltip = new TooltipView({
      target: this.$('.js-sizes')
    });
    $('body').append(sizesTooltip.render().el);
    this.addView(sizesTooltip);
  },

  autoStyle: function () {
    var style = this.autoStyler.getStyle();
    this.dataviewModel.layer.set('cartocss', style);
    this.dataviewModel.set('autoStyle', true);
  },

  cancelAutoStyle: function () {
    this.dataviewModel.layer.restoreCartoCSS();
    this.dataviewModel.set('autoStyle', false);
  }

});
