var CoreView = require('backbone/core-view');
var SyncInfoView = require('./dataset-content-sync-view');
var template = require('./dataset-content-options.tpl');

module.exports = CoreView.extend({

  className: 'Dataset-viewOptions u-flex u-justifySpace u-alignCenter',

  events: {
    'click .js-addRow': '_onAddRowClick',
    'click .js-addColumn': '_onAddColumnClick'
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

  _onAddRowClick: function () {
    this.trigger('addRow', this);
  },

  _onAddColumnClick: function () {
    this.trigger('addColumn', this);
  },

  _isCustomQueryApplied: function () {
    return this._querySchemaModel.get('query').toLowerCase() !== 'select * from ' + this._tableModel.getUnquotedName();
  },

  _isEditable: function () {
    return !this._isCustomQueryApplied() && !this._syncModel.isSync() && this._tableModel.isOwner(this._userModel);
  }
});
