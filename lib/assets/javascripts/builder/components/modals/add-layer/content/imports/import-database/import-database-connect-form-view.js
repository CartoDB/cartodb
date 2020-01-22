const checkAndBuildOpts = require('builder/helpers/required-opts');
const CoreView = require('backbone/core-view');
const template = require('./import-database-connect-form.tpl');
const sidebarTemplate = require('./import-database-sidebar.tpl');

const REQUIRED_OPTS = [
  'configModel',
  'service'
];

module.exports = CoreView.extend({

  events: {
    'keyup .js-textInput': '_onTextChanged',
    'submit .js-form': '_onSubmitForm'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.$el.html(template(this.options));
    this._addSidebar();
    return this;
  },

  _addSidebar: function () {
    this.$el.find('.ImportPanel-sidebar').append(
      sidebarTemplate(this.options)
    );
  },

  _initBinds: function () {
    this.model.bind('change:state', this._checkVisibility, this);
  },

  _checkVisibility: function () {
    const state = this.model.get('state');
    if (state === 'idle' || state === 'error') {
      this.show();
    } else {
      this.hide();
    }
  },

  _onTextChanged: function () {
    (this._isFormFilled() ? this._enableSubmit() : this._disableSubmit());
  },

  _disableSubmit: function () {
    this.$('.js-submit').attr('disabled', 'disabled');
    this.$('.js-submit').addClass('is-disabled');
  },

  _enableSubmit: function () {
    this.$('.js-submit').removeAttr('disabled');
    this.$('.js-submit').removeClass('is-disabled');
  },

  _isFormFilled: function () {
    return this.$('.js-server').val() !== '' &&
           this.$('.js-port').val() !== '' &&
           this.$('.js-database').val() !== '' &&
           this.$('.js-username').val() !== '' &&
           this.$('.js-password').val() !== '';
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);

    this.model.connector = this._getFormParams();

    if (this.model.connector) {
      this._checkConnection(this.model.connector);
    }
  },

  _getFormParams: function () {
    return {
      server: this.$('.js-server').val(),
      port: this.$('.js-port').val(),
      database: this.$('.js-database').val(),
      username: this.$('.js-username').val(),
      password: this.$('.js-password').val()
    };
  },

  _checkConnection: function (params) {
    const version = this._configModel.urlVersion('imports');
    const baseUrl = this._configModel.get('base_url');
    const self = this;

    const queryParams = this._buildQueryParamsString(params);
    fetch(baseUrl + '/api/' + version + '/connectors/' + this._service + '/connect?' + queryParams)
      .then(response => response.json())
      .then(data => self._checkConnectionSuccess(self, data))
      .catch(error => self._checkConnectionError(self, error));
  },

  _checkConnectionSuccess: function (self, data) {
    if (data && data.connected) {
      self.model.set('state', 'connected');
      self.model.set('service_name', 'connector');
    } else {
      self.model.set('state', 'error');
    }
  },

  _checkConnectionError: function (self, error) {
    console.error(error);
    self.model.set('state', 'error');
  },

  _buildQueryParamsString: function (data) {
    return Object.keys(data).map(function (key) {
      return [key, data[key]].join('=');
    }).join('&');
  }
});
