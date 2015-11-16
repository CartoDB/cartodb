var _ = require('underscore');
var View = require('cdb/core/view');
var template = require('./filter.tpl');

/**
 * Category filter view
 */
module.exports = View.extend({

  className: 'Widget-filter Widget-contentSpaced Widget-contentSpaced--sideMargins is-hidden',

  events: {
    'click .js-all': '_onSelectAll',
    'click .js-none': '_onUnselectAll'
  },

  initialize: function() {
    this.filter = this.options.filter;
    this.viewModel = this.options.viewModel;
    this._initBinds();
  },

  render: function() {
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
    this.model.bind('change:data', this.render, this);
    this.viewModel.bind('change:search', this.toggle, this);
    this.filter.bind('change', this.render, this);
    this.add_related_model(this.filter);
    this.add_related_model(this.viewModel);
  },

  _onUnselectAll: function() {
    this.filter.rejectAll(
      this.model.getData().pluck('name')
    );
  },

  _onSelectAll: function() {
    this.filter.acceptAll();
  },

  toggle: function() {
    this[ this.viewModel.isSearchEnabled() ? 'hide' : 'show' ]();
  },

  show: function() {
    this.$el.removeClass('is-hidden');
  },

  hide: function() {
    this.$el.addClass('is-hidden');
  }

});
