var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');

/**
 * Default widget content view:
 */
module.exports = WidgetContent.extend({

  initialize: function() {
    this.dataModel = this.model;
    WidgetContent.prototype.initialize.call(this);
  },

  _TEMPLATE: ' ' +
    '<div class="Widget-header">'+
      '<div class="Widget-title">'+
        '<h3 class="Widget-textBig"><%= title %></h3>'+
        '<div class="Widget-tag Widget-tag--green">'+
          '<span class="Widget-textSmaller Widget-textSmaller--upper"><%- operation %></span>'+
        '</div>'+
      '</div>'+
      '<dl class="Widget-info">'+
        '<dt class="Widget-infoItem Widget-textSmaller Widget-textSmaller--upper"><%- nulls %> null rows</dt>'+
      '</dl>'+
    '</div>'+
    '<div class="Widget-content">'+
      '<% if (!_.isUndefined(value)) { %>'+
        '<h4 class="Widget-textBigger" title="<%- value %>"><%- value %></h4>'+
      '<% } else { %>'+
        '<div class="Widget-listItem--fake"></div>'+
      '<% } %>'+
    '</div>',

  render: function() {
    this.clearSubViews();
    var template = _.template(this._TEMPLATE);
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
