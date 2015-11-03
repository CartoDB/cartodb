cdb.geo.ui.Widget.Category.FilterView = cdb.core.View.extend({

  className: 'Widget-filter Widget-contentSpaced Widget-contentSpaced--sideMargins is-hidden',

  _TEMPLATE: ' ' +
  '  <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmaller--dark Widget-textSmaller--upper"><%- totalCategories === acceptedCategories ? "All selected" : acceptedCategories + " selected" %></p>'+
  '  <div class="Widget-filterButtons">'+
  '    <% if (totalCategories !== acceptedCategories) { %><button class="Widget-link Widget-filterButton js-all">select all</button><% } %>'+
  '    <% if (totalCategories !== rejectedCategories) { %><button class="Widget-link Widget-filterButton js-none">unselect all</button><% } %>'+
  '  </div>',

  events: {
    'click .js-all': '_onSelectAll',
    'click .js-none': '_onUnselectAll'
  },

  initialize: function() {
    this.filter = this.options.filter;
    this._initBinds();
  },

  render: function() {
    var template = _.template(this._TEMPLATE);
    var totalCategories = this.model.getData().size();
    var rejectedCategories = this.filter.rejectedCategories.size();
    var acceptedCategories = totalCategories - rejectedCategories;
    var isVisible = this.filter.hasRejects();

    this.$el.html(
      template({
        totalCategories: totalCategories,
        acceptedCategories: acceptedCategories,
        rejectedCategories: rejectedCategories
      })
    );
    this[ totalCategories > 0 ? 'show' : 'hide']();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.filter.bind('change', this.render, this);
    this.add_related_model(this.filter);
  },

  _onUnselectAll: function() {
    this.filter.reject(
      this.model.getData().pluck('name')
    )
  },

  _onSelectAll: function() {
    this.filter.acceptAll();
  },

  show: function() {
    this.$el.removeClass('is-hidden');
  },

  hide: function() {
    this.$el.addClass('is-hidden');
  }

});
