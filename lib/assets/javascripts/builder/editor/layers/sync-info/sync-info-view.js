var CoreView = require('backbone/core-view');
var template = require('./sync-info.tpl');
var moment = require('moment');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var SyncOptionsModalView = require('builder/components/modals/sync-options/sync-options-modal-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'modals',
  'syncModel',
  'tableModel',
  'userModel'
];

module.exports = CoreView.extend({

  className: 'SyncInfo SyncInfo--separator',

  events: {
    'click .js-options': '_openSyncOptions'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    var runAt = this._syncModel.get('run_at');

    var d = {
      canSyncNow: this._syncModel.canSyncNow(),
      fromExternalSource: this._syncModel.get('from_external_source'),
      ranAt: moment(this._syncModel.get('ran_at') || new Date()).fromNow(),
      runAt: moment(runAt).fromNow(),
      state: this._syncModel.get('state'),
      errorCode: this._syncModel.get('error_code'),
      errorMessage: this._syncModel.get('error_message'),
      isOwner: this._tableModel.isOwner(this._userModel)
    };

    // Due to the time we need to polling, we have to display to the user
    // that the sync will be in a moment
    if (!runAt || (new Date(runAt) <= new Date())) {
      d.runAt = _t('dataset.sync.in-a-moment');
    }

    this.$el.html(template(d));

    if (d.errorCode || d.errorMessage) {
      var tooltip = new TipsyTooltipView({
        el: this.$('.js-tooltip'),
        title: function () {
          return _t('dataset.sync.error-code', { errorCode: d.errorCode }) + ':' + d.errorMessage;
        }
      });
      this.addView(tooltip);
    }

    return this;
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
