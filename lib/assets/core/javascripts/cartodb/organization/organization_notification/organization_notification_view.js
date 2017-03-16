var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-resend': '_onClickResend'
  },

  _onClickResend: function (event) {
    var $notificationItem = $(event.target).closest('.js-NotificationsList-item');
    var title = $notificationItem.find('.js-html_body').text().trim();
    var recipients = $notificationItem.find('.js-recipients').data('recipients');

    this.$('#carto_notification_body').val(title);
    this.$('input[name=carto_notification[recipients]][value=' + recipients + ']').prop('checked', true);
  }
});
