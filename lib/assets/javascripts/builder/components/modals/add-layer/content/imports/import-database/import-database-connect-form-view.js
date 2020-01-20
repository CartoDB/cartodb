var $ = require('jquery');
var _ = require('underscore');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var CoreView = require('backbone/core-view');
var template = require('./import-database-connect-form.tpl');
var sidebarTemplate = require('./import-database-sidebar.tpl');

var REQUIRED_OPTS = [
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
    var state = this.model.get('state');
    if (state === 'idle' || state === 'error') {
      this.show();
    } else {
      this.hide();
    }
  },

  _onTextChanged: function () {
    (this._isFormFilled() ? $('.js-submit').removeClass('is-disabled') : $('.js-submit').addClass('is-disabled'));
  },

  _isFormFilled: function () {
    return $('.js-server').val() !== '' &&
           $('.js-port').val() !== '' &&
           $('.js-database').val() !== '' &&
           $('.js-username').val() !== '' &&
           $('.js-password').val() !== '';
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
      server: $('.js-server').val(),
      port: $('.js-port').val(),
      database: $('.js-database').val(),
      username: $('.js-username').val(),
      password: $('.js-password').val()
    };
  },

  _checkConnection: function (params) {
    var version = this._configModel.urlVersion('imports');
    var baseUrl = this._configModel.get('base_url');
    var self = this;

    var queryParams = this._buildQueryParamsString(params);

    fetch(baseUrl + '/api/' + version + '/connectors/postgres/connect?' + queryParams)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data && data.connected) {
          self.model.set('state', 'connected');
          self.model.set('service_name', 'connector');
        } else {
          self.model.set('state', 'error');
        }
      })
      .catch(function (error) {
        console.error(error);
        self.model.set('state', 'error');
      });
  },

  _buildQueryParamsString: function (data) {
    return Object.keys(data).map(function (key) {
      return [key, data[key]].join('=');
    }).join('&');
  }
});
