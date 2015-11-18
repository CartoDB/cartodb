var _ = require('underscore');
var View = require('cdb/core/view');
var template = require('./filter_template.tpl');

/**
 * Category filter view
 */
module.exports = View.extend({

  className: 'Widget-filter Widget-contentSpaced Widget-contentSpaced--sideMargins',

  events: {
    'click .js-all': '_onSelectAll',
    'click .js-none': '_onUnselectAll',
    'click .js-apply':'_onApplyClick'
  },

  initialize: function() {
    this.filter = this.options.filter;
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
    this.search = this.options.search;
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
        isSearchEnabled: this.viewModel.isSearchEnabled(),
        isSearchApplied: this.dataModel.isSearchApplied(),
        totalCats: totalCats,
        rejectedCats: rejectedCats,
        acceptedCats: acceptedCats
      })
    );
    return this;
  },

  _initBinds: function() {
    this.dataModel.bind('change:data change:filter change:locked', this.render, this);
    this.viewModel.bind('change:search', this.render, this);
    this.search.bind('change:data', this.render, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.search);
    this.add_related_model(this.viewModel);
  },

  _onUnselectAll: function() {
    this.filter.rejectAll(
      this.dataModel.getData().pluck('name')
    );
  },

  _onSelectAll: function() {
    this.filter.acceptAll();
  },

  _onApplyClick: function() {
    this.viewModel.toggleSearch();
    this.dataModel.applyLocked();
  }

});
