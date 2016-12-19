var CoreView = require('backbone/core-view');
var TipsyTooltipView = require('../../components/tipsy-tooltip-view');
var CreationModalView = require('../../components/modals/creation/modal-creation-view');
var SyncOptionsModalView = require('../../components/modals/sync-options/sync-options-modal-view');
var SyncModel = require('../../data/synchronization-model');
var template = require('./dataset-content-sync.tpl');
var moment = require('moment');

module.exports = CoreView.extend({
  tagName: 'div',
  className: 'SyncInfo',

  events: {
    'click .js-options': '_onClickOptions',
    'click .js-syncNow': '_onClickSyncNow'
  },

  initialize: function (opts) {
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._syncModel = opts.syncModel;
    this._tableModel = opts.tableModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._modals = opts.modals;

    this._startSync = this._startSync.bind(this);

    this._initBinds();

    // Check sync now button
    if (this._syncModel.isSyncing()) {
      this._showSyncNowModal();
    }
  },

  render: function () {
    this.clearSubViews();
    var runAt = this._syncModel.get('run_at');

    var d = {
      canSyncNow: this._syncModel.canSyncNow(),
      fromExternalSource: this._syncModel.get('from_external_source'),
      ranAt: moment(this._syncModel.get('ran_at') || new Date()).fromNow(),
      runAt: moment(runAt).fromNow(),
      state: this._syncModel.get('state'),
      errorCode: this._syncModel.get('error_code'),
      errorMessage: this._syncModel.get('error_message')
    };

    // Due to the time we need to polling, we have to display to the user
    // that the sync will be in a moment
    if (!runAt || (new Date(runAt) <= new Date())) {
      d.runAt = _t('dataset.sync.in-a-moment');
    }

    this.$el
      .html(template(d))
      .removeClass()
      .addClass(this.className + ' ' + 'is-' + d.state);

    // Tipsy
    var tooltip = new TipsyTooltipView({
      el: this.$('.js-syncNowDisabled'),
      title: function () {
        return _t('dataset.sync.disabled', {
          gap: SyncModel.SYNC_GAP / (1000 * 60)
        });
      }
    });
    this.addView(tooltip);

    return this;
  },

  _initBinds: function () {
    this._syncModel.bind('change', this.render, this);
    this.add_related_model(this._syncModel);
  },

  _bindChangeSyncEvent: function () {
    this._syncModel.bind('change:state', this._finishSync, this);
    this.add_related_model(this._syncModel);
  },

  _unbindChangeSyncEvent: function () {
    this._syncModel.unbind(null, null, this);
  },

  _onClickSyncNow: function (e) {
    if (e) this.killEvent(e);

    if (this._syncModel.canSyncNow()) {
      this._showSyncNowModal();
    }
  },

  _onClickOptions: function (e) {
    var self = this;
    var tableName = this._tableModel.getUnqualifiedName();

    this._modals.create(function (modalModel) {
      return new SyncOptionsModalView({
        modalModel: modalModel,
        syncModel: self._syncModel,
        tableName: tableName
      });
    });
  },

  _startSync: function () {
    this.render();
    this._bindChangeSyncEvent();
    this._syncModel.pollCheck();
  },

  _finishSync: function () {
    if (!this._syncModel.isSyncing()) {
      this._unbindChangeSyncEvent();
      this._syncModel.destroyCheck();

      // Reload table
      this._querySchemaModel.set({
        status: 'unfetched',
        query: 'SELECT * FROM ' + this._tableModel.getUnquotedName()
      });

      this.render();
    }
  },

  _showSyncNowModal: function (e) {
    var self = this;
    var tableName = this._tableModel.getUnqualifiedName();

    this._modals.create(function (modalModel) {
      return new CreationModalView({
        modalModel: modalModel,
        loadingTitle: _t('dataset.sync.loading', { tableName: tableName }),
        errorTitle: _t('dataset.sync.error', { tableName: tableName }),
        runAction: function (opts) {
          self._syncModel.set({
            state: 'syncing',
            error_code: '',
            error_message: ''
          });

          self._syncModel.bind('change:state', function () {
            if (!self._syncModel.isSyncing()) {
              modalModel.destroy();
            }
          }, self);

          self._syncModel.syncNow(self._startSync);
        }
      });
    });
  }

});
