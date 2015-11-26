var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');
var WidgetViewModel = require('../widget_content_model');
var template = require('./template.tpl');
var animationTemplate = require('./animation_template.tpl');
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
    var format = function(value) {
      var formatter = d3.format('0,000');

      if (_.isNumber(value)) {
        return formatter(value.toFixed(2));
      }
      return 0;
    };

    var nulls = !_.isUndefined(this.dataModel.get('nulls')) && format(this.dataModel.get('nulls')) || '-';
    var isCollapsed = this.viewModel.isCollapsed();

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

    this._animateValue(this.dataModel, 'data', '.js-value', { animationSpeed: 700, formatter: format, template: animationTemplate, templateData: { prefix: prefix, suffix: suffix }});

    this.$el.toggleClass('is-collapsed', !!isCollapsed);

    return this;
  },

  _initBinds: function() {
    this.viewModel.bind('change:collapsed', this.render, this);
    WidgetContent.prototype._initBinds.call(this);
    this.add_related_model(this.viewModel);
  },

  _toggleCollapse: function() {
    this.viewModel.toggleCollapsed();
  }

});
