var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');

/**
 *  Hello Google Plus
 *
 *  - View to render/show if user is logged
 *  in CartoDB using Google Plus
 */


module.exports = cdb.core.View.extend({

  className: 'GooglePlus',

  initialize: function () {
    this.template = cdb.templates.getTemplate('account/views/google_plus_revoke');
    this._initBinds();
  },

  render: function() {
    this.$el.html(this.template());

    this._initGoogleButton();

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this._initGoogleButton, this);
  },

  _initGoogleButton: function() {
    var logged = this.model.get('logged_with_google');
    var canChangeEmail = this.model.get('can_change_email');

    var $googleRow = this.$('.js-googleRow');
    var $googleDisconnectButton = this.$('.js-googleDisconnect');
    var $googleText = this.$('.js-googleText');

    $googleRow.hide();
    $googleDisconnectButton.addClass('is-disabled');
    $googleDisconnectButton.hide();
    $googleText.hide();

    if (logged) {
      $googleRow.show();
      $googleDisconnectButton.show();
      if (canChangeEmail) {
         $googleDisconnectButton.removeClass('is-disabled');
      } else {
        $googleText.show();
      }
    }

    this.show();
  }
});
