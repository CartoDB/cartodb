var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');
var WidgetViewModel = require('../widget_content_model');
var template = require('./template.tpl');
var animationTemplate = require('./animation_template.tpl');
var formatter = require('cdb/core/format');
var d3 = require('d3');

/**
 * Default widget content view:
 */
module.exports = WidgetContent.extend({

  events: {
    'click .js-collapse': '_toggleCollapse'
  },

  initialize: function() {
    this.dataModel = this.model;
    this.viewModel = new WidgetViewModel();
    WidgetContent.prototype.initialize.call(this);
  },

  render: function() {
    this.clearSubViews();
    var value = this.dataModel.get('data');

    var nulls = !_.isUndefined(this.dataModel.get('nulls')) && formatter.formatNumber(this.dataModel.get('nulls')) || '-';
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

    this._animateValue(this.dataModel, 'data', '.js-value', animationTemplate, { animationSpeed: 700, formatter: formatter.formatNumber, templateData: { prefix: prefix, suffix: suffix }});

    this.$el.toggleClass('is-collapsed', !!isCollapsed);

    return this;
  },

  _initBinds: function() {
    this.dataModel.bind('change:collapsed', this.render, this);
    WidgetContent.prototype._initBinds.call(this);
  },

  _toggleCollapse: function() {
    this.dataModel.toggleCollapsed();
  }

});
