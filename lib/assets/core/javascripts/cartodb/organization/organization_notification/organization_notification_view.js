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
    'keyup .js-textarea': '_onTextareaKeyup',
    'mouseleave .js-textarea': '_onTextareaKeyup'
  },

  render: function () {
    this._initViews();

    var strLen = $(markdown.toHTML(this.$('#carto_notification_body').val())).text().length;
    this.sendButton.updateCounter(strLen);

    return this;
  },

  _initViews: function () {
    this.sendButton = new SendButton({
      $form: this.$('form')
    });

    this.$('.js-send').html(this.sendButton.render().el);
    this.addView(this.sendButton);
  },

  _onClickResend: function (event) {
    var $notificationItem = $(event.target).closest('.js-NotificationsList-item');
    var title = $notificationItem.find('.js-html_body').data('body');
    var recipients = $notificationItem.find('.js-recipients').data('recipients');

    this.$('#carto_notification_body').val(title);
    this.$('input[name="carto_notification[recipients]"]').prop('checked', false);
    this.$('input[name="carto_notification[recipients]"][value="' + recipients + '"]').prop('checked', true);

    var strLen = $(markdown.toHTML(this.$('#carto_notification_body').val())).text().length;
    this.sendButton.updateCounter(strLen);
  },

  _onTextareaKeydown: function (event) {
    if (event.keyCode === 13 && event.metaKey) {
      this.sendButton.onUpdate();
    }
  },

  _onTextareaKeyup: function (event) {
    var $target = $(event.target);
    var strLen = $(markdown.toHTML($target.val())).text().length;
    this.sendButton.updateCounter(strLen);
  },

  _onClickRemove: function (event) {
    var $target = $(event.target);
    this.remove_notification_dialog = new RemoveNotificationDialog({
      authenticityToken: this.options.authenticityToken,
      notificationId: $target.data('id')
    });
    this.remove_notification_dialog.appendToBody();
    this.addView(this.remove_notification_dialog);
  }
});
