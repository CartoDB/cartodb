var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var VendorScriptsView = require('./vendor_scripts_view');

var REQUIRED_OPTIONS = [
  'data',
  'vizID',
  'assetsVersion',
  'handleRedirection'
];

var ENTER_KEY_CODE = 13;
var API_URL = _.template('/u/<%- owner %>/api/v1/viz/<%- uuid %>');
var HOME_URL = _.template('<%- protocol %>://<%- owner %>.<%- host %>');

module.exports = cdb.core.View.extend({
  events: {
    'input .js-input': '_cleanError',
    'keydown .js-input': '_onKeyDown'
  },

  initialize: function (options) {
    _.each(REQUIRED_OPTIONS, function (item) {
      if (options[item] === undefined) throw new Error('password_protected view: ' + item + ' is required');
      this[item] = options[item];
    }, this);

    this._checkPassword = this._checkPassword.bind(this);
    this._handleRejection = this._handleRejection.bind(this);
    this.template = cdb.templates.getTemplate('common/views/password_protected_static');

    this.url = API_URL({
      uuid: this.vizID,
      owner: this.data.config.user_name
    });

    this.homeUrl = HOME_URL({
      protocol: cdb.config.get('cartodb_com_hosted') ? 'https' : 'http',
      owner: this.data.config.user_name,
      host: this.data.config.account_host
    });

    this.model = new cdb.core.Model({
      password: '',
      error: false,
      fetching: false
    });

    this._initBinds();
    this._initVendorViews();
  },

  render: function () {
    this.$el.html(this.template({
      hasError: this.model.get('error'),
      home: this.homeUrl,
      title: _t('protected_map.content.header'),
      hint: _t('protected_map.content.tip'),
      placeholder: _t('protected_map.content.placeholder'),
      error: _t('protected_map.content.error')
    }));

    this._focusInput();
    return this;
  },

  _initBinds: function () {
    this.model.on('change:error', this.render, this);
  },

  _initVendorViews: function () {
    var vendorScriptsView = new VendorScriptsView({
      config: this.data.config,
      assetsVersion: this.assetsVersion
    });
    document.body.appendChild(vendorScriptsView.render().el);
    this.addView(vendorScriptsView);
  },

  _checkPassword: function () {
    var password = this.model.get('password');
    var isFetching = this.model.get('fetching');

    if (isFetching || $.trim(password) === '') {
      return;
    }

    var handleRedirection = this.handleRedirection.bind(this, password);

    this.model.set('fetching', true);

    $.ajax({
      url: this.url,
      data: {
        password: password
      }
    })
      .done(handleRedirection)
      .fail(this._handleRejection);
  },

  _handleRejection: function () {
    this.model.set({
      error: true,
      fetching: false
    });
  },

  _cleanError: function () {
    this.model.set({
      password: this.$('.js-input').val(),
      error: false
    });
  },

  _focusInput: function () {
    var password = this.model.get('password');
    // A bit hacky but it's nice to put the caret after the content
    this.$('.js-input').focus();
    this.$('.js-input').val(password);
  },

  _onKeyDown: function (event) {
    var key = event.which;

    if (key === ENTER_KEY_CODE) {
      event.stopPropagation();
      this._checkPassword();
    }
  }
});
