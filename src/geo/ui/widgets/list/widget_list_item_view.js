cdb.geo.ui.Widget.List.ItemView = cdb.core.View.extend({

  tagName: 'li',
  className: 'Widget-listItem Widget-listItem--withBorders',

  events: {
    'click .js-button': '_onItemClick'
  },

  _TEMPLATE: ' ' +
    '<button type="button" class="Widget-listItemButton js-button">'+
      '<div class="Widget-contentSpaced Widget-contentSpaced--topAligned Widget-contentSpaced--start">'+
        '<em class="Widget-dot Widget-listDot"></em>'+
        '<div class="Widget-contentFull">'+
          '<p class="Widget-textSmall Widget-textSmall--upper"><%- items[0][1] %></p>'+
          '<% if (itemsCount > 2) { %>'+
            '<dl class="Widget-inlineList">'+
            '<% for (var i = 1, l = itemsCount; i < l; i++) { %>'+
              '<div class="Widget-inlineListItem Widget-textSmaller Widget-textSmaller--noEllip">'+
                '<dd class="Widget-textSmaller--bold Widget-textSmaller--dark"><%- items[i][1] %></dd>'+
                '<dt><%- items[i][0] %></dt>'+
              '</div>'+
            '<% } %>'+
            '</dl>'+
          '<% } else if (itemsCount === 2) { %>'+
            '<dl class="Widget-textSmaller Widget-textSmaller--noEllip u-tSpace">'+
              '<dd class="Widget-textSmaller--bold Widget-textSmaller--dark"><%- items[1][1] %> </dd>'+
              '<dt><%- items[1][0] %></dt>'+
            '</dl>'+
          '<% } %>'+
        '</div>'+
      '</div>'+
    '</button>',

  render: function() {
    var template = _.template(this._TEMPLATE);
    var items = _.pairs(this.model.toJSON());
    var size = _.size(items);
    this.$el.html(
      template({
        items: items,
        itemsCount: size
      })
    );
    return this;
  },

  _onItemClick: function() {
    console.log("on item click!");
  }

});
