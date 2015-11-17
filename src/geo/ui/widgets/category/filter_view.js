var _ = require('underscore');
var View = require('cdb/core/view');
var template = require('./filter_template.tpl');

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
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
    this._initBinds();
  },

  render: function() {
    var totalCats = this.dataModel.getData().size();
    var rejectedCats = this.filter.getRejected().size();
    var acceptedCats = this.filter.getAccepted().size();

    this.$el.html(
      template({
        isLocked: this.dataModel.isLocked(),
        totalLocked: this.dataModel.getLockedSize(),
        totalCats: totalCats,
        rejectedCats: rejectedCats,
        acceptedCats: acceptedCats
      })
    );
    return this;
  },

  _initBinds: function() {
    this.dataModel.bind('change:data change:filter change:locked', this.render, this);
    this.viewModel.bind('change:search', this.toggle, this);
    this.add_related_model(this.dataModel);
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
