var View = cdb.core.View
var template = require('./options-template.tpl')

/**
 * Category filter view
 *
 */
module.exports = View.extend({
  className: 'CDB-Widget-filter CDB-Widget-contentSpaced CDB-Widget-contentSpaced--sideMargins',

  events: {
    'click .js-all': '_onSelectAll',
    'click .js-none': '_onUnselectAll',
    'click .js-lock': '_lockCategories',
    'click .js-unlock': '_unlockCategories'
  },

  initialize: function () {
    this.dataModel = this.options.dataModel
    this.viewModel = this.options.viewModel
    this._initBinds()
  },

  render: function () {
    var totalCats = this.dataModel.getData().size()
    var rejectedCats = this.dataModel.getRejectedCount()
    var acceptedCats = this.dataModel.getAcceptedCount()

    this.$el.html(
      template({
        isLocked: this.dataModel.isLocked(),
        canBeLocked: this.dataModel.canBeLocked(),
        totalLocked: this.dataModel.getLockedSize(),
        isSearchEnabled: this.viewModel.isSearchEnabled(),
        isSearchApplied: this.dataModel.isSearchApplied(),
        isAllRejected: this.dataModel.isAllFiltersRejected(),
        totalCats: totalCats,
        rejectedCats: rejectedCats,
        acceptedCats: acceptedCats
      })
    )
    return this
  },

  _initBinds: function () {
    this.dataModel.bind('change:data change:filter change:locked change:lockCollection', this.render, this)
    this.viewModel.bind('change:search', this.render, this)
    this.add_related_model(this.dataModel)
    this.add_related_model(this.viewModel)
  },

  _lockCategories: function () {
    this.dataModel.lockCategories()
  },

  _unlockCategories: function () {
    this.dataModel.unlockCategories()
  },

  _onUnselectAll: function () {
    this.dataModel.rejectAll()
  },

  _onSelectAll: function () {
    this.dataModel.acceptAll()
  }

})
