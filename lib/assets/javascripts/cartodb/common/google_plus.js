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

  events: {
    'click .js-googleDisconnect': '_onDisconnect'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/google_plus');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        iframeSrc: this.options.iframeSrc
      })
    );

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this._onChange, this);
  },

  _onChange: function() {
    var enabled = this.model.get('google_enabled');
    var logged = this.model.get('logged_with_google');
    var canChangeEmail = this.model.get('can_change_email');

    this.$('.js-googleIframe').hide();
    this.$('.js-googleRow').hide();
    this.$('.js-googleDisconnect').addClass('is-disabled').hide();
    this.$('.js-googleText').hide();

    if (enabled) {
      this.$('.js-googleRow').show();
      if (logged) {
        this.$('.js-googleDisconnect').show();
        if (canChangeEmail) {
           this.$('.js-googleDisconnect').removeClass('is-disabled');
        } else {
          this.$('.js-googleText').show();
        }
      }
    }

    this.show();
  },

  _onDisconnect: function(e) {
    var enabled = this.model.get('google_enabled');
    var logged = this.model.get('logged_with_google');
    var canChangeEmail = this.model.get('can_change_email');

    if (e) {
      this.killEvent(e);
    }

    if (canChangeEmail && logged && enabled) {
      window.disconnectGoogleAccount(
        this._callback,
        this._callback
      );  
    }
  },

  _callback: function() {
    window.location.reload();
  }

});