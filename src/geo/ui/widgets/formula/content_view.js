/**
 *  Default widget content view:
 *
 *
 */

cdb.geo.ui.Widget.Formula.Content = cdb.geo.ui.Widget.Content.extend({

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
        '<p class="Widget-textBigger"><%= value %></p>'+
        '<% if (desc) { %>'+
          '<p class="Widget-textSmaller"><%= desc %></p>'+
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
