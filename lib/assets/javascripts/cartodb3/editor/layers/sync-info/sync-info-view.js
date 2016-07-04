var CoreView = require('backbone/core-view');
var template = require('./sync-info.tpl');
var SyncOptionsModalView = require('../../../components/modals/sync-options/sync-options-modal-view');

module.exports = CoreView.extend({

  className: 'SyncInfo SyncInfo--separator u-flex u-justifySpace',

  events: {
    'click .js-options': '_openSyncOptions'
  },

  initialize: function (opts) {
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.tableModel) throw new Error('tableModel is required');

    this._syncModel = opts.syncModel;
    this._modals = opts.modals;
    this._tableModel = opts.tableModel;
  },

  render: function () {
    this.$el.html(
      template()
    );
    this._initViews();
    return this;
  },

  _initViews: function () {

  },

  _openSyncOptions: function () {
    var self = this;
    this._modals.create(function (modalModel) {
      return new SyncOptionsModalView({
        syncModel: self._syncModel,
        modalModel: modalModel,
        tableName: self._tableModel.getUnquotedName()
      });
    });
  }

});
