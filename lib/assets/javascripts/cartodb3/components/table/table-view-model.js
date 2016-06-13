var Backbone = require('backbone');

/**
 *  Table view model
 */

module.exports = Backbone.Model.extend({
  defaults: {
    page: 0,
    order_by: '',
    sort_order: 'asc',
    readonly: false,
    tableName: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._querySchemaModel = opts.querySchemaModel;

    this._setOrderBy();
    this._initBinds();
  },

  _initBinds: function () {
    this._querySchemaModel.bind('change:status', this._setOrderBy, this);
  },

  _setOrderBy: function () {
    this.set('order_by', this._getOrderByAfterReset(), {
      silent: true
    });
  },

  resetFetchDefaults: function () {
    this.set({
      page: this.defaults.page,
      order_by: '',
      sort_order: this.defaults.sortOrder
    }, {
      silent: true
    });
  },

  _getOrderByAfterReset: function () {
    if (this._querySchemaModel.columnsCollection.where({ name: 'cartodb_id' }).length) {
      return 'cartodb_id';
    }
    return '';
  },

  isDisabled: function () {
    if (this.get('readonly') || !this.get('tableName')) {
      return true;
    } else {
      return this.isCustomQueryApplied();
    }
  },

  isCustomQueryApplied: function () {
    var query = this._querySchemaModel.get('query');
    return query.toLowerCase() !== 'select * from ' + this.get('tableName');
  }

});
