var cdb = require('cartodb.js');
var template = require('./options-template.tpl');

/**
 * Category filter view
 *
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-filter CDB-Widget-contentSpaced CDB-Widget-contentSpaced--sideMargins',

  events: {
    'click .js-all': '_onSelectAll',
    'click .js-none': '_onUnselectAll',
    'click .js-lock': '_lockCategories',
    'click .js-unlock': '_unlockCategories'
  },

  initialize: function () {
    this.dataModel = this.options.dataModel;
    this.viewModel = this.options.viewModel;
    this._initBinds();
  },

  render: function () {
    var f = this.dataModel.filter;
    this.$el.html(
      template({
        acceptedCats: f.acceptedCategories.size(),
        rejectedCats: f.rejectedCategories.size(),
        areAllRejected: f.areAllRejected(),
        isLocked: this.viewModel.isLocked(),
        canBeLocked: this.viewModel.canBeLocked(),
        totalLocked: this.viewModel.lockedCategories.size(),
        isSearchEnabled: this.viewModel.isSearchEnabled(),
        isSearchApplied: this.dataModel.isSearchApplied(),
        totalCats: this.dataModel.getData().size()
      })
    );
    return this;
  },

  _initBinds: function () {
    this.dataModel.bind('change:data change:filter', this.render, this);
    this.viewModel.bind('change:search change:locked', this.render, this);
    this.viewModel.lockedCategories.bind('change add remove', this.render, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
    this.add_related_model(this.viewModel.lockedCategories);
  },

  _lockCategories: function () {
    this.viewModel.lockCategories();
  },

  _unlockCategories: function () {
    this.viewModel.unlockCategories();
  },

  _onUnselectAll: function () {
    this.dataModel.filter.rejectAll();
  },

  _onSelectAll: function () {
    this.dataModel.filter.acceptAll();
  }

});
