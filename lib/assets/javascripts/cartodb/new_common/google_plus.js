var $ = require('jquery');
var cdb = require('cartodb.js');

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
    this.template = cdb.templates.getTemplate('new_common/views/google_plus');
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

    // If google plus auth is enabled
    this.$('.js-googleRow')[ enabled ? 'show' : 'hide' ]();
    // Keep google iframe always hidden
    this.$('.js-googleIframe').hide();
    // Google disconnect?
    this.$('.js-googleDisconnect')[ logged ? 'show' : 'hide' ]();
    this.$('.js-googleDisconnect')[ !canChangeEmail ? 'addClass' : 'removeClass' ]('is-disabled');
    // Google text?
    this.$('.js-googleText')[ logged && !canChangeEmail ? 'show' : 'hide' ]();

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
    window.reload();
  }

});