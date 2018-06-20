const CoreView = require('backbone/core-view');
const ServiceOauth = require('dashboard/data/service-oauth-model');
const ServiceValidToken = require('dashboard/data/service-valid-token-model');
const DisconnectDialog = require('dashboard/views/account/service-disconnect-dialog/service-disconnect-dialog-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./service-item.tpl');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 *  OAuth service item view
 *  Connect or disconnect from a service
 */

module.exports = CoreView.extend({
  _WINDOW_INTERVAL: 1000,

  className: 'FormAccount-row',

  events: {
    'click .js-connect': '_connect',
    'click .js-disconnect': '_disconnect'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();

    this._modals = new ModalsServiceModel();

    if (this.model.get('connected')) {
      this._checkToken();
    }
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:state change:connected', this.render);
  },

  render: function () {
    this.$el.html(
      template(this.model.attributes)
    );

    return this;
  },

  _connect: function (e) {
    if (this.model.get('state') === 'loading') {
      return;
    }

    this.model.set('state', 'loading');

    const service = new ServiceOauth(null, {
      datasourceName: this.model.get('name'),
      configModel: this._configModel
    });

    service.fetch({
      success: (model, response) => {
        if (response.success && response.url) {
          this._openWindow(response.url);
        }
      },
      error: () => this._setErrorState()
    });
  },

  _disconnect: function () {
    if (this.model.get('state') === 'loading') return;

    this._modals.create(modalModel => new DisconnectDialog({ serviceModel: this.model, modalModel }));
  },

  _checkToken: function (successCallback, errorCallback) {
    const validToken = new ServiceValidToken(
      { datasource: this.model.get('name') },
      { configModel: this._configModel }
    );

    validToken.fetch({
      success: (model, response) => {
        this.model.set('connected', response.oauth_valid);

        if (response.oauth_valid) {
          successCallback && successCallback();
        } else {
          errorCallback && errorCallback();
        }
      },
      error: () => {
        errorCallback && errorCallback();
      }
    });
  },

  _setErrorState: function () {
    this.model.set('state', 'error');
  },

  _reloadWindow: function () {
    window.location.reload();
  },

  _openWindow: function (url) {
    const popupWindow = window.open(url, null, 'menubar=no,toolbar=no,width=600,height=495');

    const checkConnectionInterval = window.setInterval(() => {
      if (popupWindow && popupWindow.closed) {
        // Check valid token to see if user has connected or not.
        this._checkToken(this._reloadWindow, this._setErrorState.bind(this));
        clearInterval(checkConnectionInterval);
      } if (!popupWindow) {
        // Show error directly
        this._setErrorState();
        clearInterval(checkConnectionInterval);
      }
    }, this._WINDOW_INTERVAL);
  }

});
