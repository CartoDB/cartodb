cdb.geo.ui.Widget.Category.ItemView = cdb.core.View.extend({

  tagName: 'li',
  className: 'Widget-listItem',

  events: {
    'click .js-button': '_onItemClick'
  },

  _TEMPLATE: ' ' +
    '<li class="Widget-listItem">'+
      '<button type="button" class="Widget-listItemInner Widget-listButton js-button <%- isDisabled ? \'is-disabled\' : \'\' %>">'+
        '<div class="Widget-contentSpaced">'+
          '<p class="Widget-textSmall Widget-textSmall--bold Widget-textSmall--upper"><%- name %></p>'+
          '<p class="Widget-textSmaller">~<%- value %></p>'+
        '</div>'+
        '<div class="Widget-progressBar">'+
          '<div class="Widget-progressState" style="width: <%- percentage %>%"></div>'+
        '</div>'+
      '</button>'+
    '</li>',

  initialize: function(options) {
    this.filter = options.filter;
    this.model.bind('change', this.render, this);
  },

  render: function() {
    var template = _.template(this._TEMPLATE);
    var value = this.model.get('count');

    this.$el.html(
      template({
        name: this.model.get('name'),
        value: Math.ceil(value),
        percentage: (value / this.model.get('maxCount')) * 100,
        isDisabled: !this.model.get('selected') ? 'is-disabled' : ''
      })
    );

    return this;
  },

  _onItemClick: function() {
    this.model.set('selected', !this.model.get('selected'));
    if (this.model.get('selected')) {
      this.filter.accept(this.model.get('name'));
    } else {
      this.filter.reject(this.model.get('name'));
    }
  }
});
