var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var ServiceOauth = require('../common/service_models/service_oauth_model');
var ServiceValidToken = require('../common/service_models/service_valid_token_model');
var DisconnectDialog = require('./service_disconnect_dialog_view');
var _ = require('underscore-cdb-v3');

/**
 *  OAuth service item view
 *
 *  Connect or disconnect from a service
 *
 */

module.exports = cdb.core.View.extend({

  _WINDOW_INTERVAL: 1000,

  className: 'FormAccount-row',
  tagName: 'div',

  events: {
    'click .js-connect': '_connect',
    'click .js-disconnect': '_disconnect'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('account/views/service_item');
    this._initBinds();
    if (this.model.get('connected')) {
      this._checkToken();
    }
  },

  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_setErrorState');
    this.model.bind('change:state change:connected', this.render, this);
  },

  _connect: function(e) {
    if (this.model.get('state') === "loading") {
      return;
    }

    var self = this;
    this.model.set('state', 'loading');
    var service = new ServiceOauth(null, { datasource_name: this.model.get('name') });
    service.fetch({
      success: function(m, r) {
        if (r.success && r.url) {
          self._openWindow(r.url);
        }
      },
      error: function() {
        self._setErrorState();
      }
    });
  },

  _disconnect: function() {
    if (this.model.get('state') === "loading") {
      return;
    }

    var view = new DisconnectDialog({
      model: this.model,
      clean_on_hide: true,
      enter_to_confirm: false
    });

    view.appendToBody();
  },

  _checkToken: function(successCallback, errorCallback) {
    var self = this;
    var validToken = new ServiceValidToken({ datasource: this.model.get('name') });
    
    validToken.fetch({
      success: function(m, r) {
        self.model.set('connected', r.oauth_valid);

        if (r.oauth_valid) {
          successCallback && successCallback();
        } else {
          errorCallback && errorCallback();  
        }
      },
      error: function() {
        errorCallback && errorCallback();
      }
    });
  },

  _setErrorState: function() {
    this.model.set('state', 'error');
  },

  _reloadWindow: function() {
    window.location.reload();
  },

  _openWindow: function(url) {
    var self = this;
    var i = window.open(url, null, "menubar=no,toolbar=no,width=600,height=495");
    var e = window.setInterval(function() {
      if (i && i.closed) {
        // Check valid token to see if user has connected or not.
        self._checkToken(self._reloadWindow, self._setErrorState);
        clearInterval(e)
      } else if (!i) {
        // Show error directly
        self._setErrorState();
        clearInterval(e)
      }
    }, this._WINDOW_INTERVAL);
  }

});
