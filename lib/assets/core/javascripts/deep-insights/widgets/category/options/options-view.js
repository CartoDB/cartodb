var CoreView = require('backbone/core-view');
var template = require('./options-template.tpl');

/**
 * Category filter view
 *
 */
module.exports = CoreView.extend({
  className: 'CDB-Widget-filter CDB-Widget-contentSpaced CDB-Widget-contentSpaced--sideMargins',

  events: {
    'click .js-all': '_onSelectAll',
    'click .js-lock': '_lockCategories',
    'click .js-unlock': '_unlockCategories'
  },

  initialize: function () {
    this.dataviewModel = this.options.dataviewModel;
    this.widgetModel = this.options.widgetModel;
    this._initBinds();
  },

  render: function () {
    var acceptedCats = this.dataviewModel.filter.acceptedCategories.size();
    var rejectedCats = this.dataviewModel.filter.rejectedCategories.size();
    var areAllRejected = this.dataviewModel.filter.areAllRejected();
    var totalCats = this.dataviewModel.getData().size();
    var isLocked = this.widgetModel.isLocked();

    this.$el.html(
      template({
        isSearchEnabled: this.widgetModel.isSearchEnabled(),
        isSearchApplied: this.dataviewModel.isSearchApplied(),
        isLocked: isLocked,
        canBeLocked: this.widgetModel.canBeLocked(),
        allSelected: (rejectedCats === 0 && acceptedCats === 0 && !areAllRejected),
        canSelectAll: !isLocked && (rejectedCats > 0 || acceptedCats > 0 || areAllRejected),
        noneSelected: areAllRejected || (!totalCats && !acceptedCats),
        acceptedCats: acceptedCats,
        totalLocked: this.widgetModel.lockedCategories.size(),
        totalCats: totalCats
      })
    );
    return this;
  },

  _initBinds: function () {
    this.widgetModel.bind('change:search change:locked', this.render, this);
    this.widgetModel.lockedCategories.bind('change add remove', this.render, this);
    this.add_related_model(this.widgetModel);
    this.add_related_model(this.widgetModel.lockedCategories);

    this.dataviewModel.bind('change:data', this.render, this);
    this.add_related_model(this.dataviewModel);

    var f = this.dataviewModel.filter;
    f.acceptedCategories.bind('add remove reset', this.render, this);
    f.rejectedCategories.bind('add remove reset', this.render, this);
    this.add_related_model(f.rejectedCategories);
    this.add_related_model(f.acceptedCategories);
  },

  _lockCategories: function () {
    this.widgetModel.lockCategories();
  },

  _unlockCategories: function () {
    this.widgetModel.unlockCategories();
  },

  _onSelectAll: function () {
    this.dataviewModel.filter.acceptAll();
  }

});
