cdb.geo.ui.Widget.List.ItemView = cdb.core.View.extend({

  tagName: 'li',
  className: 'Widget-listItem Widget-listItem--withBorders',

  events: {
    'click .js-button': '_onItemClick'
  },

  _TEMPLATE: ' ' +
    '<% if (isClickable) { %>'+
      '<button type="button" class="Widget-listItemButton js-button">'+
    '<% } %>'+
      '<div class="Widget-contentSpaced Widget-contentSpaced--topAligned Widget-contentSpaced--start">'+
        '<em class="Widget-dot Widget-listDot"></em>'+
        '<% if (itemsCount > 0) { %>'+
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
                '<dd class="Widget-textSmaller--bold Widget-textSmaller--dark u-rSpace"><%- items[1][1] %> </dd>'+
                '<dt><%- items[1][0] %></dt>'+
              '</dl>'+
            '<% } %>'+
          '</div>'+
        '<% } %>'+
      '</div>'+
    '<% if (isClickable) { %>'+
      '</button>'+
    '<% } %>',


  render: function() {
    var template = _.template(this._TEMPLATE);
    var data = this.model.toJSON();
    var hasCDBId = this._hasCDBId(data);
    var renderData = this._sanitizeData(this.model.toJSON());
    var items = _.pairs(renderData);

    this.$el.html(
      template({
        items: items,
        isClickable: hasCDBId,
        itemsCount: _.size(items)
      })
    );

    // If there is no cartodb_id defined, click event should
    // be disabled
    this[ hasCDBId ? 'delegateEvents' : 'undelegateEvents' ]();
    return this;
  },

  // Remove cartodb_id, if exists
  _sanitizeData: function(data) {
    return _.omit(data, function(value, key, object) {
      return key === 'cartodb_id';
    });
  },

  _hasCDBId: function(data) {
    return !_.isEmpty(
      _.filter(data, function(value, key){
        return key === 'cartodb_id'
      })
    )
  },

  _onItemClick: function() {
    console.log("on item click!");
    this.trigger('itemClicked', this.model, this);
  }

});
