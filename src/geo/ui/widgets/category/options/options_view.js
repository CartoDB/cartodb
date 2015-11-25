var _ = require('underscore');
var View = require('cdb/core/view');
var template = require('./options_template.tpl');

/**
 * Category filter view
 *
 */
module.exports = View.extend({

  className: 'Widget-filter Widget-contentSpaced Widget-contentSpaced--sideMargins',

  events: {
    'click .js-all': '_onSelectAll',
    'click .js-none': '_onUnselectAll'
  },

  initialize: function() {
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
    this._initBinds();
  },

  render: function() {
    var totalCats = this.dataModel.getData().size();
    var rejectedCats = this.dataModel.getRejectedCount();
    var acceptedCats = this.dataModel.getAcceptedCount();

    this.$el.html(
      template({
        isLocked: this.dataModel.isLocked(),
        totalLocked: this.dataModel.getLockedSize(),
        isSearchEnabled: this.viewModel.isSearchEnabled(),
        isSearchApplied: this.dataModel.isSearchApplied(),
        isAllRejected: this.dataModel.isAllFiltersRejected(),
        totalCats: totalCats,
        rejectedCats: rejectedCats,
        acceptedCats: acceptedCats
      })
    );
    return this;
  },

  _initBinds: function() {
    this.dataModel.bind('change:data change:filter change:locked change:lockCollection', this.render, this);
    this.viewModel.bind('change:search', this.render, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  _onUnselectAll: function() {
    this.dataModel.rejectAll();
  },

  _onSelectAll: function() {
    this.dataModel.acceptAll();
  }

});
