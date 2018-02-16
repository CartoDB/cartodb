var Backbone = require('backbone');

/**
 *  Table view model
 */

module.exports = Backbone.Model.extend({
  defaults: {
    page: 0,
    order_by: '',
    sort_order: '',
    readonly: false,
    tableName: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');

    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;
    this._columnsCollection = opts.columnsCollection;

    this._setOrderAndSort();

    this.listenTo(this._columnsCollection, 'reset', this._setOrderAndSort);
  },

  _setOrderAndSort: function () {
    var hasCartodbId = this._columnsCollection.where({name: 'cartodb_id'}).length;

    if (hasCartodbId && !this.isCustomQueryApplied()) {
      this.set({
        'order_by': 'cartodb_id',
        'sort_order': 'asc'
      }, {
        silent: true
      });
    }
  },

  resetFetchDefaults: function () {
    this.set({
      page: this.defaults.page,
      order_by: '',
      sort_order: ''
    }, {
      silent: true
    });
  },

  isDisabled: function () {
    return this._analysisDefinitionNodeModel.isReadOnly();
  },

  isCustomQueryApplied: function () {
    return this._analysisDefinitionNodeModel.isCustomQueryApplied();
  }
});
