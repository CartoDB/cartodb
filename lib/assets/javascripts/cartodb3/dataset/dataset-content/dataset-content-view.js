var CoreView = require('backbone/core-view');
var TableManager = require('../../components/table/table-manager');
var DatasetContentOptionsView = require('./dataset-content-options-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._tableModel = opts.tableModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._queryGeometryModel = opts.queryGeometryModel;
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
    this.add_related_model(this._syncModel);
  },

  _initViews: function () {
    var permissionModel = this._tableModel._permissionModel;
    var hasWriteAccess = permissionModel.isOwner(this._userModel) || permissionModel.hasWriteAccess(this._userModel);
    var isReadOnly = this._syncModel.isSync() || !hasWriteAccess;

    var tableName = this._tableModel.getUnqualifiedName();
    if (this._userModel.isInsideOrg()) {
      var userName = this._tableModel.get('permission').owner.username;
      tableName = userName + '.' + tableName;
    }

    var tableView = TableManager.create({
      relativePositionated: true,
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: this._querySchemaModel,
      tableName: tableName,
      readonly: isReadOnly,
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
      queryGeometryModel: this._queryGeometryModel,
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
