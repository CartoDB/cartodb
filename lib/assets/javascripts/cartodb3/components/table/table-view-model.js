var Backbone = require('backbone');

/**
 *  Table view model
 */

module.exports = Backbone.Model.extend({
  defaults: {
    page: 0,
    order_by: 'cartodb_id',
    sort_order: 'asc',
    readonly: false,
    tableName: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._querySchemaModel = opts.querySchemaModel;
  },

  resetFetchDefaults: function () {
    this.set({
      page: this.defaults.page,
      order_by: this.defaults.orderBy,
      sort_order: this.defaults.sortOrder
    }, {
      silent: true
    });
  },

  isDisabled: function () {
    if (this.get('readonly') || !this.get('tableName')) {
      return true;
    } else {
      return this._isCustomQueryApplied();
    }
  },

  _isCustomQueryApplied: function () {
    var query = this._querySchemaModel.get('query');
    return query.toLowerCase() !== 'select * from ' + this.get('tableName');
  }

});
