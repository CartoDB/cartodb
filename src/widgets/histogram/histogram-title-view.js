var d3 = require('d3');
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
        isSizesApplied: this.dataviewModel.get('histogram_sizes'),
        isCollapsed: this.widgetModel.get('collapsed')
      })
    );
    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.widgetModel.bind('change:title change:collapsed', this.render, this);
    this.dataviewModel.bind('change:histogram_sizes', this.render, this);
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
    var index = this.dataviewModel._dataProvider._layerIndex;
    var sublayer = this.dataviewModel._dataProvider._vectorLayerView;
    var style = sublayer.styles[index];
    this.originalStyle = style;
    var scale = d3.scale.linear().domain([this.dataviewModel.get('start'), this.dataviewModel.get('end')]).range([4,24]);
    var sizes = '\n' + this.dataviewModel.get('data').map(function (bin) {
      return '#' + this.dataviewModel.layer.get('layer_name') + 
      '['+this.dataviewModel.get('column')+'>=' + bin.start + 
      ']{\nmarker-width: ' + 
      scale(bin.start) + ';\n}'
    }.bind(this)).join('\n');
    style = style.replace('clientes', 'clientes_2')
    sublayer.setCartoCSS(index, style + sizes, true);
    this.dataviewModel.set('histogram_sizes', true);
  },

  _cancelSizes: function () {
    var index = this.dataviewModel._dataProvider._layerIndex;
    var sublayer = this.dataviewModel._dataProvider._vectorLayerView;
    sublayer.setCartoCSS(index, this.originalStyle);
    this.dataviewModel.set('histogram_sizes', false);
  }

});
