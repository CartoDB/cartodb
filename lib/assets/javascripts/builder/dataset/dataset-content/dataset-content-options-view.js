var CoreView = require('backbone/core-view');
var ModalExportDataView = require('builder/components/modals/export-data/modal-export-data-view');
var SyncInfoView = require('./dataset-content-sync-view');
var template = require('./dataset-content-options.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'analysisDefinitionNodeModel',
  'configModel',
  'modals',
  'userModel'
];

module.exports = CoreView.extend({

  className: 'Dataset-viewOptions u-flex u-justifySpace u-alignCenter',

  events: {
    'click .js-addRow': '_onAddRowClick',
    'click .js-addColumn': '_onAddColumnClick',
    'click .js-export': '_onExportClick'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._tableModel = this._analysisDefinitionNodeModel.getTableModel();
    this._querySchemaModel = this._analysisDefinitionNodeModel.querySchemaModel;
    this._queryGeometryModel = this._analysisDefinitionNodeModel.queryGeometryModel;
    this._syncModel = this._tableModel.getSyncModel();

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        isEditable: !this._analysisDefinitionNodeModel.isReadOnly(),
        isCustomQueryApplied: this._analysisDefinitionNodeModel.isCustomQueryApplied()
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._querySchemaModel, 'change:query', this.render);
    this.listenTo(this._syncModel, 'destroy', this.render);
  },

  _initViews: function () {
    if (this._tableModel.isSync() && this._tableModel.isOwner(this._userModel)) {
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
    this._modals.create(function (modalModel) {
      return new ModalExportDataView({
        modalModel: modalModel,
        fromView: 'dataset',
        configModel: this._configModel,
        filename: this._tableModel.getUnquotedName(),
        queryGeometryModel: this._queryGeometryModel
      });
    }.bind(this));
  },

  _onAddRowClick: function () {
    this.trigger('addRow', this);
  },

  _onAddColumnClick: function () {
    this.trigger('addColumn', this);
  }
});
