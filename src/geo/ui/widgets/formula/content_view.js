var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');
var template = require('./template.tpl');
var d3 = require('d3');

/**
 * Default widget content view:
 */
module.exports = WidgetContent.extend({

  initialize: function() {
    this.dataModel = this.model;
    WidgetContent.prototype.initialize.call(this);
  },

  render: function() {
    this.clearSubViews();
    var value = this.dataModel.get('data');
    var format = d3.format('0,000');

    if (_.isNumber(value)) {
      value = format(value.toFixed(2));
    }

    this.$el.html(
      template({
        title: this.dataModel.get('title'),
        value: value,
        operation: this.dataModel.get('operation'),
        nulls: this.dataModel.get('nulls'),
        prefix: this.dataModel.get('prefix'),
        suffix: this.dataModel.get('suffix')
      })
    );

    return this;
  }

});
