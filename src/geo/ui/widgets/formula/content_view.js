var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');
var WidgetViewModel = require('../widget_content_model');
var template = require('./template.tpl');
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
    var format = d3.format('0,000');
    var nulls = !_.isUndefined(this.dataModel.get('nulls')) && format(this.dataModel.get('nulls')) || '-';
    var isCollapsed = this.viewModel.isCollapsed();

    if (_.isNumber(value)) {
      value = format(value.toFixed(2));
    }

    this.$el.html(
      template({
        title: this.dataModel.get('title'),
        value: value,
        operation: this.dataModel.get('operation'),
        nulls: nulls,
        prefix: this.dataModel.get('prefix'),
        suffix: this.dataModel.get('suffix'),
        isCollapsed: isCollapsed
      })
    );

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
