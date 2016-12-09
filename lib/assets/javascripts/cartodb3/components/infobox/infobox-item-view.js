var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./infobox.tpl');
var templateButton = require('./infobox-button.tpl');
var templateQuota = require('./infobox-quota.tpl');

var INFOBOX_TYPE = {
  error: 'is-error',
  alert: 'is-alert',
  code: 'is-dark',
  default: ''
};

module.exports = CoreView.extend({
  events: {
    'click .js-mainAction': '_onMainClick',
    'click .js-secondAction': '_onSecondClick'
  },

  initialize: function (opts) {
    if (!opts.title) throw new Error('Title is required');
    if (!opts.body) throw new Error('Body is required');

    this._title = opts.title;
    this._body = opts.body;
    this._loading = opts.loading;

    if (opts.quota) {
      this._quota = opts.quota;
    }

    if (opts.mainAction) {
      this._mainLabel = opts.mainAction.label;
      this._mainType = opts.mainAction.type;
      this._mainDisabled = opts.mainAction.disabled;
      this._mainPosition = opts.mainAction.position;
    }

    if (opts.secondAction) {
      this._secondLabel = opts.secondAction.label;
      this._secondType = opts.secondAction.type;
      this._secondDisabled = opts.secondAction.disabled;
      this._secondPosition = opts.secondAction.position;
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
    var hasButtons = this._mainLabel || this._secondLabel;
    var hasQuota = !_.isEmpty(this._quota);
    var isLoading = this._loading;

    var view = template({
      title: this._title,
      body: this._body,
      type: this._type,
      isLoading: isLoading,
      hasQuota: hasQuota,
      hasButtons: hasButtons
    });

    this.setElement(view);

    if (this._mainLabel) {
      var mainLabelposition = this._mainPosition;

      this.$('.js-' + mainLabelposition + 'Position').html(templateButton({
        action: 'mainAction',
        label: this._mainLabel,
        type: this._mainType,
        disabled: this._mainDisabled
      }));
    }

    if (this._secondLabel) {
      var secondLabelposition = this._secondPosition;

      this.$('.js-' + secondLabelposition + 'Position').html(templateButton({
        action: 'secondAction',
        label: this._secondLabel,
        type: this._secondType,
        disabled: this._secondDisabled
      }));
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

  _onMainClick: function (e) {
    e.preventDefault();
    this.trigger('action:main');
  },

  _onSecondClick: function (e) {
    e.preventDefault();
    this.trigger('action:second');
  }
});
