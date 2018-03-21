const CoreView = require('backbone/core-view');
const markdown = require('markdown');
const $ = require('jquery');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const RemoveNotificationDialogView = require('./delete-notification-dialog-view');
const SendButtonView = require('./send-button-view');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = CoreView.extend({

  events: {
    'click .js-resend': '_onClickResend',
    'click .js-remove': '_onClickRemove',
    'keydown .js-textarea': '_onTextareaKeydown',
    'input .js-textarea': '_updateCounter',
    'propertychange .js-textarea': '_updateCounter'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$textarea = this.$('#carto_notification_body');
    this._modals = new ModalsServiceModel();

    this._initViews();
    this._updateCounter();

    return this;
  },

  _initViews: function () {
    this.sendButton = new SendButtonView();

    this.$('.js-send').html(this.sendButton.render().el);
    this.addView(this.sendButton);

    this.sendButton.bind('submitForm', this._submitForm, this);
  },

  _submitForm: function () {
    if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
      this.$('form').clone().appendTo('body').submit(); // FF only
    } else {
      this.$('form').submit();
    }
  },

  _updateCounter: function () {
    const strLen = $(markdown.toHTML(this.$textarea.val())).text().length;
    this.sendButton.updateCounter(strLen);
  },

  _onClickResend: function (event) {
    const $notificationItem = $(event.target).closest('.js-NotificationsList-item');
    const title = $notificationItem.find('.js-html_body').data('body');
    const recipients = $notificationItem.find('.js-recipients').data('recipients');

    this.$textarea.val(title);
    this.$('input[name="carto_notification[recipients]"]').prop('checked', false);
    this.$('input[name="carto_notification[recipients]"][value="' + recipients + '"]').prop('checked', true);

    $('body').animate({
      scrollTop: 0
    });

    this._updateCounter();
  },

  _onTextareaKeydown: function (event) {
    if (event.keyCode === 13 && event.metaKey) {
      this.sendButton.onUpdate();
    }
  },

  _onClickRemove: function (event) {
    const $target = $(event.target);

    this._modals.create(function (modalModel) {
      return new RemoveNotificationDialogView({
        configModel: this._configModel,
        modalModel,
        authenticityToken: this.options.authenticityToken,
        notificationId: $target.data('id')
      });
    });
  }
});
