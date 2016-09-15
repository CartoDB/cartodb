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
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._querySchemaModel = opts.querySchemaModel;

    this._setOrderAndSort();
    this._initBinds();
  },

  _initBinds: function () {
    this._querySchemaModel.bind('change:status', this._setOrderAndSort, this);
  },

  _setOrderAndSort: function () {
    var hasCartodbId = this._querySchemaModel.columnsCollection.where({name: 'cartodb_id'}).length;

    if (hasCartodbId && !this.isCustomQueryApplied()) {
      this.set({
        'order_by': 'cartodb_id',
        'sort_by': 'asc'
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
    if (this.get('readonly') || !this.get('tableName')) {
      return true;
    } else {
      return this.isCustomQueryApplied();
    }
  },

  isCustomQueryApplied: function () {
    var sanitizeName = function (str) {
      return str.replace(/"/g, '').toLowerCase();
    };
    var query = this._querySchemaModel.get('query');
    return sanitizeName(query) !== sanitizeName('select * from ' + this.get('tableName'));
  }

});
