/**
 *  Default widget content view:
 *
 */

cdb.geo.ui.Widget.Content = cdb.core.View.extend({

  className: 'Widget-body',

  _TEMPLATE: ' ' +
    '<div class="Widget-header">'+
      '<div class="Widget-title Widget-contentSpaced">'+
        '<h3 class="Widget-textBig" title="<%- title %>"><%- title %></h3>'+
      '</div>'+
      '<dl class="Widget-info">'+
        '<dt class="Widget-infoItem Widget-textSmaller Widget-textSmaller--upper"><%- itemsCount %> items</dt>'+
      '</dl>'+
    '</div>'+
    '<div class="Widget-content js-content"></div>',

  _PLACEHOLDER: ' ' +
    '<ul class="Widget-list Widget-list--withBorders">' +
      '<li class="Widget-listItem Widget-listItem--withBorders Widget-listItem--fake"></li>' +
    '</ul>',

  initialize: function() {
    this.filter = this.options.filter;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var template = _.template(this._TEMPLATE);
    var data = this.model.getData();
    var isDataEmpty = _.isEmpty(data) || _.size(data) === 0;
    this.$el.html(
      template({
        title: this.model.get('title'),
        itemsCount: !isDataEmpty ? data.length : '-'
      })
    );

    if (isDataEmpty) {
      this._addPlaceholder();
    }

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:data', this.render, this);
  },

  _addPlaceholder: function() {
    if (this._PLACEHOLDER) {
      var placeholderTemplate = _.template(this._PLACEHOLDER);
      this.$('.js-content').append(placeholderTemplate());
    } else {
      cdb.log.info('Placeholder template doesn\'t exist');
    }
  }

});
