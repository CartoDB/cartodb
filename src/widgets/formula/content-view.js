var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var formatter = require('app/formatter');
var WidgetContent = require('../standard/widget-content-view');
var WidgetViewModel = require('../widget-content-model');
var template = require('./template.tpl');
var TooltipView = require('../widget-tooltip-view');
var animationTemplate = require('./animation-template.tpl');
var AnimateValues = require('../animate-values.js');

/**
 * Default widget content view:
 */
module.exports = WidgetContent.extend({
  events: {
    'click .js-collapse': '_toggleCollapse'
  },

  initialize: function () {
    this.dataModel = this.model;
    this.viewModel = new WidgetViewModel();
    WidgetContent.prototype.initialize.call(this);
  },

  render: function () {
    this.clearSubViews();
    var value = this.dataModel.get('data');

    var format = function (value) {
      var formatter = d3.format('0,000');

      if (_.isNumber(value)) {
        return formatter(value.toFixed(2));
      }
      return 0;
    };

    var nulls = !_.isUndefined(this.dataModel.get('nulls')) && formatter.formatNumber(this.dataModel.get('nulls')) || '-';
    var isCollapsed = this.dataModel.isCollapsed();

    var prefix = this.dataModel.get('prefix');
    var suffix = this.dataModel.get('suffix');

    this.$el.html(
      template({
        title: this.dataModel.get('title'),
        operation: this.dataModel.get('operation'),
        value: value,
        nulls: nulls,
        prefix: prefix,
        suffix: suffix,
        isCollapsed: isCollapsed
      })
    );

    var animator = new AnimateValues({
      el: this.$el
    });

    animator.animateValue(this.dataModel, 'data', '.js-value', animationTemplate, { animationSpeed: 700, formatter: format, templateData: { prefix: prefix, suffix: suffix } });

    this.$el.toggleClass('is-collapsed', !!isCollapsed);

    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.dataModel.bind('change:collapsed', this.render, this);
    WidgetContent.prototype._initBinds.call(this);
  },

  _initViews: function () {
    var tooltip = new TooltipView({
      target: this.$('.js-collapse')
    });
    $('body').append(tooltip.render().el);
    this.addView(tooltip);
  },

  _toggleCollapse: function () {
    this.dataModel.toggleCollapsed();
  }

});
