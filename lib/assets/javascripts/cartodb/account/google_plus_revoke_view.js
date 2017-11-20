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
    'click .js-googleDisconnect': '_onClick'
  },

  initialize: function () {
    this.template = cdb.templates.getTemplate('account/views/google_plus_revoke');
    this._initModels();
    this._initBinds();
    this._initGoogleButton();
    this._initGoogleApi();
  },

  _initModels: function () {
    this.iframeSrc = this.options.iframeSrc;
    this.clientId = this.options.clientId;
    this.googleAuth = {};
  },

  render: function() {
    this.$el.html(
      this.template({
        iframeSrc: this.iframeSrc,
        clientId: this.clientId
      })
    );

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this._onChange, this);
  },

  _initGoogleApi: function () {
    var self = this;

    gapi.load('auth2', function() {
      // Retrieve the singleton for the GoogleAuth library and set up the client.
      self.googleAuth = gapi.auth2.init({
        client_id: self.clientId,
        cookiepolicy: 'single_host_origin',
        fetch_basic_profile: true,
        scope: 'profile email'
      });
    });
  },

  _onClick: function () {
    if (this.googleAuth && this.googleAuth.isSignedIn.get()) {
      this.googleAuth.disconnect();
    }
  },

  _initGoogleButton: function() {
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
  }
});
