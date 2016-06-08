var Backbone = require('backbone');

/**
 *  Table view model
 */

module.exports = Backbone.Model.extend({
  defaults: {
    page: 0,
    readonly: false,
    tableName: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._querySchemaModel = opts.querySchemaModel;
  },

  resetPage: function () {
    this.set('page', 0);
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
