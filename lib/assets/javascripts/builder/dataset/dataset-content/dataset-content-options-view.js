var CoreView = require('backbone/core-view');
var ModalExportDataView = require('builder/components/modals/export-data/modal-export-data-view');
var SyncInfoView = require('./dataset-content-sync-view');
var template = require('./dataset-content-options.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'analysisDefinitionNodeModel',
  'configModel',
  'modals',
  'userModel',
  'visModel'
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
    var sample = this._visModel.get('sample');
    var subscription = this._visModel.get('subscription');
    var entity = sample || subscription || {};
    var entityLabel = (subscription || (sample && sample.entity_subscribed))
      ? _t('dataset.actions.view-subscription')
      : _t('dataset.actions.subscribe-to-entity');
    this.clearSubViews();
    this.$el.html(
      template({
        isEditable: !this._analysisDefinitionNodeModel.isReadOnly(),
        isCustomQueryApplied: this._analysisDefinitionNodeModel.isCustomQueryApplied(),
        entity_id: entity.entity_id,
        entity_type: entity.entity_type,
        entityLabel: entityLabel,
        entityTag: (sample && !!sample.entity_id && 'SAMPLE') || (subscription && !!subscription.entity_id && 'SUBSCRIPTION'),
        baseUrl: this._configModel.get('base_url')
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
        querySchemaModel: this._querySchemaModel,
        visModel: this._visModel
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
        queryGeometryModel: this._queryGeometryModel,
        querySchemaModel: this._querySchemaModel,
        canHideColumns: false
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
