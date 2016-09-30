var CoreView = require('backbone/core-view');
var ModalExportDataView = require('../../components/modals/export-data/modal-export-data-view');
var SyncInfoView = require('./dataset-content-sync-view');
var template = require('./dataset-content-options.tpl');
var SQLUtils = require('../../helpers/sql-utils');
var Utils = require('../../helpers/utils');

module.exports = CoreView.extend({

  className: 'Dataset-viewOptions u-flex u-justifySpace u-alignCenter',

  events: {
    'click .js-addRow': '_onAddRowClick',
    'click .js-addColumn': '_onAddColumnClick',
    'click .js-export': '_onExportClick'
  },

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._tableModel = opts.tableModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._querySchemaModel = opts.querySchemaModel;
    this._queryGeometryModel = opts.queryGeometryModel;
    this._syncModel = opts.syncModel;
    this._configModel = opts.configModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        isEditable: this._isEditable(),
        isCustomQueryApplied: this._isCustomQueryApplied()
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._querySchemaModel.bind('change:query', this.render, this);
    this.add_related_model(this._querySchemaModel);
    this._syncModel.bind('change:interval', this.render, this);
    this.add_related_model(this._syncModel);
  },

  _initViews: function () {
    if (this._syncModel.isSync() && this._tableModel.isOwner(this._userModel)) {
      var syncInfo = new SyncInfoView({
        modals: this._modals,
        syncModel: this._syncModel,
        tableModel: this._tableModel,
        querySchemaModel: this._querySchemaModel
      });

      this.$('.js-sync').html(syncInfo.render().el);
      this.addView(syncInfo);
    }
  },

  _onExportClick: function () {
    var self = this;
    this._modals.create(function (modalModel) {
      return new ModalExportDataView({
        modalModel: modalModel,
        configModel: self._configModel,
        fileName: self._tableModel.getUnquotedName(),
        queryGeometryModel: self._queryGeometryModel
      });
    });
  },

  _onAddRowClick: function () {
    this.trigger('addRow', this);
  },

  _onAddColumnClick: function () {
    this.trigger('addColumn', this);
  },

  _isCustomQueryApplied: function () {
    var tableName = this._tableModel.getUnqualifiedName();
    var defaultQuery = 'SELECT * FROM ' + Utils.safeTableNameQuoting(tableName);

    if (this._userModel.isInsideOrg()) {
      var userName = this._tableModel.get('permission').owner.username;
      defaultQuery = SQLUtils.prependTableName(defaultQuery, tableName, userName);
    }

    return !SQLUtils.isSameQuery(defaultQuery, this._querySchemaModel.get('query'));
  },

  _isEditable: function () {
    return !this._isCustomQueryApplied() && !this._syncModel.isSync() && this._tableModel.isOwner(this._userModel);
  }
});
