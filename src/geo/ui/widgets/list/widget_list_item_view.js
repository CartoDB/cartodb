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
          '<p class="Widget-textSmall Widget-textSmall--upper"><%- district %></p>'+

          '<% if (size > 2) { %>'
            <dl class="Widget-inlineList">
              <div class="Widget-inlineListItem Widget-textSmaller Widget-textSmaller--noEllip">
                <dd class="Widget-textSmaller--bold Widget-textSmaller--dark">1,934</dd>
                <dt>People affected</dt>
              </div>
            </dl>
          '<% } else if (size === 2) { %>'+
            '<dl class="Widget-textSmaller Widget-textSmaller--noEllip u-tSpace">'+
              '<dd class="Widget-textSmaller--bold Widget-textSmaller--dark"><%- trees %> </dd>'+
              '<dt>trees</dt>'+
            '</dl>'+
          '<% } %>'+

        '</div>'+
      '</div>'+
    '</button>',

  render: function() {
    var template = _.template(this._TEMPLATE);
    var items = this.model.toJSON();
    var size = _.size(items);
    this.$el.html(
      template(
        _.extend(
          items,
          {
            itemsCount: size
          }
        )
      )
    );
    return this;
  },

  _onItemClick: function() {
    console.log("on item click!");
  }

});
