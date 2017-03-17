var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var RemoveNotificationDialog = require('./delete_notification_dialog_view');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-resend': '_onClickResend',
    'click .js-remove': '_onClickRemove'
  },

  _onClickResend: function (event) {
    var $notificationItem = $(event.target).closest('.js-NotificationsList-item');
    var title = $notificationItem.find('.js-html_body').text().trim();
    var recipients = $notificationItem.find('.js-recipients').data('recipients');

    this.$('#carto_notification_body').val(title);
    this.$('input[name=carto_notification[recipients]][value=' + recipients + ']').prop('checked', true);
  },

  _onClickRemove: function (event) {
    this.killEvent(event);

    var notificationId = $(event.target).data('id');

    this.remove_notification_dialog = new RemoveNotificationDialog({
      authenticityToken: this.options.authenticityToken,
      notificationId: notificationId
    });
    this.remove_notification_dialog.appendToBody();
    this.addView(this.remove_notification_dialog);
  }
});
