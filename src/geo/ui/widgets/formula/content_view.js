var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');

/**
 * Default widget content view:
 */
module.exports = WidgetContent.extend({

  _TEMPLATE: ' ' +
    '<div class="Widget-header">'+
      '<div class="Widget-title">'+
        '<h3 class="Widget-textBig"><%= title %></h3>'+
        '<div class="Widget-tag Widget-tag--green">'+
          '<span class="Widget-textSmaller Widget-textSmaller--upper">-</span>'+
        '</div>'+
      '</div>'+
      '<dl class="Widget-info">'+
        '<dt class="Widget-infoItem Widget-textSmaller Widget-textSmaller--upper">- null rows</dt>'+
      '</dl>'+
    '</div>'+
    '<div class="Widget-content">'+
      '<% if (!_.isUndefined(value)) { %>'+
        '<h4 class="Widget-textBigger" title="<%- value %>"><%- value %></h4>'+
        '<% if (desc) { %>'+
          '<p class="Widget-textSmaller" title="<%- desc %>"><%- desc %></p>'+
        '<% } %>'+
      '<% } else { %>'+
        '<div class="Widget-listItem--fake"></div>'+
      '<% } %>'+
    '</div>',

  render: function() {
    this.clearSubViews();
    var template = _.template(this._TEMPLATE);
    var columnsTitle = this.viewModel.get('columns_title');
    var desc = columnsTitle && columnsTitle[0] || '';
    this.$el.html(
      template({
        title: this.viewModel.get('title'),
        value: this.dataModel.get('data'),
        desc: desc
      })
    );

    return this;
  }

});
