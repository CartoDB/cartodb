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
      params: this.options.params,
      errorMessage: this._model.get('errorMessage')
    }));
    this._addSidebar();

    this.form = {
      submit: this.$('.js-submit')
    };

    for (let param of this.options.params) {
      this.form[param.key] = this.$(`.js-${param.key}`);
    }

    if (this._model.connection) {
      for (let param of this.options.params) {
        this.form[param.key].val(this._model.connection[param.key]);
      }
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
    let isFilled = true;
    for (let param of this.options.params) {
      if (!param.optional) {
        isFilled &= this.form[param.key].val() !== '';
      }
    }
    return isFilled;
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);

    this._model.connection = this._getFormParams();

    if (this._model.connection) {
      this._checkConnection(this._model.connection);
    }
  },

  _getFormParams: function () {
    const params = {};
    for (let param of this.options.params) {
      params[param.key] = this.form[param.key].val();
    }
    return params;
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
