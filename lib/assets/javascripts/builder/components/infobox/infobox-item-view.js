var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./infobox.tpl');
var templateButton = require('./infobox-button.tpl');
var templateQuota = require('./infobox-quota.tpl');

var INFOBOX_TYPE = {
  error: 'is-error',
  alert: 'is-alert',
  code: 'is-dark',
  success: 'is-success',
  default: ''
};

module.exports = CoreView.extend({
  events: {
    'click .js-action': '_onActionClick',
    'click .js-close': '_onCloseClick'
  },

  initialize: function (opts) {
    if (opts.title === undefined) throw new Error('Title is required');
    if (opts.body === undefined) throw new Error('Body is required');

    this._title = opts.title;
    this._body = opts.body;
    this._loading = opts.loading;
    this._isClosable = opts.closable;
    this._klass = opts.klass;

    if (opts.quota) {
      this._quota = opts.quota;
    }

    if (opts.action) {
      this._actionLabel = opts.action.label;
      this._actionType = opts.action.type;
      this._actionDisabled = opts.action.disabled;
    }

    this._type = INFOBOX_TYPE[opts.type || 'default'];
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var hasQuota = !_.isEmpty(this._quota);
    var isLoading = this._loading;

    var view = template({
      className: this._klass,
      title: this._title,
      body: this._body,
      type: this._type,
      isLoading: isLoading,
      hasQuota: hasQuota,
      hasButtons: this._actionLabel || this._isClosable,
      isClosable: this._isClosable,
      closeLabel: _t('editor.messages.common.cancel')
    });

    this.setElement(view);

    if (this._actionLabel) {
      this.$('.js-actionPosition').html(
        templateButton({
          action: 'action',
          label: this._actionLabel,
          type: this._actionType,
          disabled: this._actionDisabled
        })
      );
    }

    if (hasQuota) {
      var quota = this._quota;
      var quotaPer = ((quota.usedQuota / quota.totalQuota) * 100);
      if (isNaN(quotaPer)) {
        quotaPer = 100;
      }
      var progressState = 'fine';
      if (quotaPer > 75 && quotaPer < 90) {
        progressState = 'alert';
      } else if (quotaPer >= 90) {
        progressState = 'caution';
      }

      this.$('.js-quota').html(templateQuota({
        quotaMessage: quota.quotaMessage || '',
        progressState: progressState,
        quotaPer: quotaPer
      }));
    }
  },

  _onActionClick: function (e) {
    this.trigger('action:main');
  },

  _onCloseClick: function (e) {
    this.trigger('action:close');
  }
});
