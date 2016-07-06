var CoreView = require('backbone/core-view');
var TableManager = require('../../components/table/table-manager');
var DatasetContentOptionsView = require('./dataset-content-options-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._tableModel = opts.tableModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._querySchemaModel = opts.querySchemaModel;
    this._syncModel = opts.syncModel;
    this._configModel = opts.configModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._tableModel.bind('change:name', function () {
      this._querySchemaModel.set({
        status: 'unfetched',
        query: 'SELECT * FROM ' + this._tableModel.getUnquotedName()
      });
      this.render();
    }, this);
    this.add_related_model(this._tableModel);
    this._syncModel.bind('change:interval', function (mdl, interval) {
      if (!interval) {
        this.render();
      }
    }, this);
  },

  _initViews: function () {
    var tableView = TableManager.create({
      relativePositionated: true,
      querySchemaModel: this._querySchemaModel,
      tableName: this._tableModel.get('name'),
      readonly: this._syncModel.isSync() || !this._tableModel.isOwner(this._userModel),
      modals: this._modals,
      configModel: this._configModel
    });
    this.addView(tableView);
    this.$el.append(tableView.render().el);

    var datasetContentOptionsView = new DatasetContentOptionsView({
      modals: this._modals,
      userModel: this._userModel,
      tableModel: this._tableModel,
      querySchemaModel: this._querySchemaModel,
      syncModel: this._syncModel,
      configModel: this._configModel
    });
    datasetContentOptionsView.bind('addColumn', function () {
      tableView.addColumn();
    });
    datasetContentOptionsView.bind('addRow', function () {
      tableView.addRow();
    });

    this.addView(datasetContentOptionsView);
    this.$el.prepend(datasetContentOptionsView.render().el);
  }
});
