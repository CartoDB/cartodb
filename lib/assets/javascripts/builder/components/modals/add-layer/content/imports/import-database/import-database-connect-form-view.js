const CartoNode = require('carto-node');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const CoreView = require('backbone/core-view');
const template = require('./import-database-connect-form.tpl');
const sidebarTemplate = require('./import-database-sidebar.tpl');
const common = require('./import-database-common');

const REQUIRED_OPTS = [
  'configModel',
  'model',
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
    this.$el.html(template({
      title: this.options.title,
      errorMessage: this._model.get('errorMessage')
    }));
    this._addSidebar();

    this.form = {
      submit: this.$('.js-submit'),
      server: this.$('.js-server'),
      port: this.$('.js-port'),
      database: this.$('.js-database'),
      username: this.$('.js-username'),
      password: this.$('.js-password')
    };

    if (this._model.connection) {
      this.form.server.val(this._model.connection.server);
      this.form.port.val(this._model.connection.port);
      this.form.database.val(this._model.connection.database);
      this.form.username.val(this._model.connection.username);
      this.form.password.val(this._model.connection.password);
    }
    return this;
  },

  _addSidebar: function () {
    this.$el.find('.ImportPanel-sidebar').append(
      sidebarTemplate(this.options)
    );
  },

  _initBinds: function () {
    this._model.bind('change:state', this._checkVisibility, this);
    this._model.bind('change:errorMessage', this.render, this);
  },

  _checkVisibility: function () {
    const state = this._model.get('state');
    if (state === 'idle') {
      this.show();
    } else {
      this.hide();
    }
  },

  _onTextChanged: function () {
    (this._isFormFilled() ? common.enableButton(this.form.submit) : common.disableButton(this.form.submit));
  },

  _isFormFilled: function () {
    return this.form.server.val() !== '' &&
           this.form.port.val() !== '' &&
           this.form.database.val() !== '' &&
           this.form.username.val() !== '' &&
           this.form.password.val() !== '';
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);

    this._model.connection = this._getFormParams();

    if (this._model.connection) {
      this._checkConnection(this._model.connection);
    }
  },

  _getFormParams: function () {
    return {
      server: this.form.server.val(),
      port: this.form.port.val(),
      database: this.form.database.val(),
      username: this.form.username.val(),
      password: this.form.password.val()
    };
  },

  _checkConnection: function (params) {
    this._resetErrorMessage();

    const dbConnectorsClient = new CartoNode.AuthenticatedClient().dbConnectors();
    dbConnectorsClient.checkConnection(this._service, params, (errors, _response, data) => {
      if (errors) {
        this._checkConnectionError(data);
      } else if (data && data.connected) {
        this._checkConnectionSuccess();
      }
    });
  },

  _checkConnectionSuccess: function () {
    this._model.set('state', 'connected');
    this._model.set('service_name', 'connector');
    this._resetErrorMessage();
  },

  _checkConnectionError: function (data) {
    if (data.responseJSON && data.responseJSON.connected === false) {
      this._model.set('errorMessage', _t('components.modals.add-layer.imports.database.connection-error'));
    } else {
      this._model.set('errorMessage', _t('components.modals.add-layer.imports.database.general-error'));
    }
  },

  _resetErrorMessage: function () {
    this._model.set('errorMessage', undefined);
  }
});
