var CoreView = require('backbone/core-view');
var TableManager = require('../components/table/table-manager');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.visModel) throw new Error('visModel is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._tableModel = opts.tableModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._querySchemaModel = opts.querySchemaModel;
    this._syncModel = opts.syncModel;
    this._visModel = opts.visModel;
    this._configModel = opts.configModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._visModel.bind('change:name', function () {
      this._querySchemaModel.set({
        status: 'unfetched',
        query: 'SELECT * FROM ' + this._tableModel.get('name')
      });
      this.render();
    }, this);
  },

  _initViews: function () {
    var tableView = TableManager.create({
      className: 'Table--relative',
      querySchemaModel: this._querySchemaModel,
      tableName: this._tableModel.get('name'),
      readonly: this._syncModel.id || !this._tableModel.isOwner(this._userModel),
      modals: this._modals,
      configModel: this._configModel
    });
    this.addView(tableView);
    this.$el.append(tableView.render().el);
  }
});
