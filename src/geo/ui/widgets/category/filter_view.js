var _ = require('underscore');
var View = require('cdb/core/view');

/**
 * Category filter view
 */
module.exports = View.extend({

  className: 'Widget-filter Widget-contentSpaced Widget-contentSpaced--sideMargins is-hidden',

  _TEMPLATE: ' ' +
  '<p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmaller--dark Widget-textSmaller--upper">'+
    '<%- rejectedCats === 0 ? "All selected" : selectedCats + " selected" %>'+
  '</p>'+
  '<div class="Widget-filterButtons">'+
    '<% if (rejectedCats !== 0 && totalCats > 0 || acceptedCats > 0) { %>'+
      '<button class="Widget-link Widget-filterButton js-all">select all</button>'+
    '<% } %>'+
    '<% if (totalCats > rejectedCats) { %>'+
      '<button class="Widget-link Widget-filterButton js-none">unselect all</button>'+
    '<% } %>'+
  '</div>',

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
    var totalCats = this.model.getData().size();
    var selectedCats = this.model.getData().filter(function(m){ return m.get('selected') }).length;
    var rejectedCats = this.filter.getRejected().size();
    var acceptedCats = this.filter.getAccepted().size();

    this.$el.html(
      template({
        totalCats: totalCats,
        selectedCats: selectedCats,
        rejectedCats: rejectedCats,
        acceptedCats: acceptedCats
      })
    );
    this[ totalCats > 0 ? 'show' : 'hide']();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.filter.bind('change', this.render, this);
    this.add_related_model(this.filter);
  },

  _onUnselectAll: function() {
    this.filter.rejectAll(
      this.model.getData().pluck('name')
    );
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
