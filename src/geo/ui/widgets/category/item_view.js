cdb.geo.ui.Widget.Category.ItemView = cdb.core.View.extend({

  tagName: 'li',
  className: 'Widget-listItem',

  events: {
    'click .js-button': '_onItemClick'
  },

  _TEMPLATE: ' ' +
    '<li class="Widget-listItem">'+
      '<button type="button" class="Widget-listItemInner Widget-listButton">'+
        '<div class="Widget-contentSpaced">'+
          '<p class="Widget-textSmall Widget-textSmall--bold Widget-textSmall--upper"><%- name %></p>'+
          '<p class="Widget-textSmaller">~<%- value %></p>'+
        '</div>'+
        '<div class="Widget-progressBar">'+
          '<div class="Widget-progressState" style="width: <%- percentage %>%"></div>'+
        '</div>'+
      '</button>'+
    '</li>',

  render: function() {
    var template = _.template(this._TEMPLATE);
    var value = Math.random().toFixed(2);

    this.$el.html(
      template({
        name: value,
        value: Math.ceil(value * 100),
        percentage: value * 100
      })
    );

    return this;
  },

  _onItemClick: function() {
    console.log("category clicked!");
  }

});
