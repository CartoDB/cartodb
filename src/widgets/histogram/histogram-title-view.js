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
    'click .js-cancelSizes': '_cancelSizes',
    'click .js-collapse': '_toggleCollapse'
  },

  initialize: function () {
    this.viewModel = this.options.viewModel;
    this.dataModel = this.options.dataModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        title: this.viewModel.get('title'),
        isSizesApplied: this.dataModel.get('histogramSizes'),
        isCollapsed: this.viewModel.isCollapsed()
      })
    );
    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.viewModel.bind('change:collapsed', this.render, this);
    this.dataModel.bind('change:histogramSizes', this.render, this);
    this.add_related_model(this.dataModel);
  },

  _initViews: function () {
    var sizesTooltip = new TooltipView({
      target: this.$('.js-sizes')
    });
    $('body').append(sizesTooltip.render().el);
    this.addView(sizesTooltip);

    var collapseTooltip = new TooltipView({
      target: this.$('.js-collapse')
    });
    $('body').append(collapseTooltip.render().el);
    this.addView(collapseTooltip);
  },

  _applySizes: function () {
    this.dataModel.set('histogramSizes', true);
  },

  _cancelSizes: function () {
    this.dataModel.set('histogramSizes', false);
  },

  _toggleCollapse: function () {
    this.viewModel.toggleCollapsed();
  }

});
