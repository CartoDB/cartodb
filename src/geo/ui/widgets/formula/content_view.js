var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');
var template = require('./template.tpl');

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
    this.$el.html(
      template({
        title: this.dataModel.get('title'),
        value: this.dataModel.get('data'),
        operation: this.dataModel.get('operation'),
        nulls: this.dataModel.get('nulls')
      })
    );

    return this;
  }

});
