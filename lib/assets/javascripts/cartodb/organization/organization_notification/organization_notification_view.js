var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var RemoveNotificationDialog = require('./delete_notification_dialog_view');
var SendButton = require('./send_button_view');
var markdown = require('markdown');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-resend': '_onClickResend',
    'click .js-remove': '_onClickRemove',
    'keydown .js-textarea': '_onTextareaKeydown',
    'input .js-textarea': '_updateCounter',
    'propertychange .js-textarea': '_updateCounter'
  },

  render: function () {
    this.$textarea = this.$('#carto_notification_body');

    this._initViews();
    this._updateCounter();

    return this;
  },

  _initViews: function () {
    this.sendButton = new SendButton();

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
    var strLen = $(markdown.toHTML(this.$textarea.val())).text().length;
    this.sendButton.updateCounter(strLen);
  },

  _onClickResend: function (event) {
    var $notificationItem = $(event.target).closest('.js-NotificationsList-item');
    var title = $notificationItem.find('.js-html_body').data('body');
    var recipients = $notificationItem.find('.js-recipients').data('recipients');

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

  _destroyRemoveNotificationDialog: function () {
    if (this.remove_notification_dialog) {
      this._unbindRemoveNotificationDialog();
      this.remove_notification_dialog.remove();
      this.removeView(this.remove_notification_dialog);
      this.remove_notification_dialog.hide();
      delete this.remove_notification_dialog;
    }
  },

  _bindRemoveNotificationDialog: function () {
    cdb.god.bind('closeDialogs:delete', this._destroyRemoveNotificationDialog, this);
  },

  _unbindRemoveNotificationDialog: function () {
    cdb.god.unbind('closeDialogs:delete', this._destroyRemoveNotificationDialog, this);
  },

  _onClickRemove: function (event) {
    cdb.god.trigger('closeDialogs:delete');

    var $target = $(event.target);

    this.remove_notification_dialog = new RemoveNotificationDialog({
      authenticityToken: this.options.authenticityToken,
      notificationId: $target.data('id')
    });
    this.remove_notification_dialog.appendToBody();
    this._bindRemoveNotificationDialog();
    this.addView(this.remove_notification_dialog);
  }
});
