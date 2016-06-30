var CoreView = require('backbone/core-view');
var TableManager = require('../components/table/table-manager');
var DatasetOptionsView = require('./dataset-options-view');
var ExportModalView = require('./export-modal-view');

module.exports = CoreView.extend({

  events: {
    'click .js-export': '_onExportClick'
  },

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
        query: 'SELECT * FROM ' + this._tableModel.get('name')
      });
      this.render();
    }, this);
    this.add_related_model(this._tableModel);
  },

  _initViews: function () {
    var tableView = TableManager.create({
      relativePositionated: true,
      querySchemaModel: this._querySchemaModel,
      tableName: this._tableModel.get('name'),
      readonly: this._syncModel.id || !this._tableModel.isOwner(this._userModel),
      modals: this._modals,
      configModel: this._configModel
    });
    this.addView(tableView);
    this.$el.append(tableView.render().el);

    var datasetOptionsView = new DatasetOptionsView({
      modals: this._modals,
      userModel: this._userModel,
      tableModel: this._tableModel,
      querySchemaModel: this._querySchemaModel,
      syncModel: this._syncModel,
      configModel: this._configModel
    });
    datasetOptionsView.bind('addColumn', function () {
      tableView.addColumn();
    });
    datasetOptionsView.bind('addRow', function () {
      tableView.addRow();
    });

    this.addView(datasetOptionsView);
    this.$el.prepend(datasetOptionsView.render().el);
  },

  _onExportClick: function () {
    this._modals.create(
      function (modalModel) {
        return new ExportModalView({
          modalModel: modalModel
        });
      }
    );
  }
});
