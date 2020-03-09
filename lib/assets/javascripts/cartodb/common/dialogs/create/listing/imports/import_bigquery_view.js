var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var HeaderView = require('./data_import/data_header_view');
var FormView = require('./data_import/bigquery_form_view');
var SelectedDataset = require('./import_bigquery_selected_dataset_view');
var ImportDataView = require('./import_data_view');
var ServiceToken = require('../../../../service_models/service_token_model');
var ServiceOauth = require('../../../../service_models/service_oauth_model');
var UploadModel = require('../../../../background_polling/models/upload_model');
var ServiceLoader = require('./service_import/service_loader_view');


/**
 *  Import BigQuery panel
 *
 *  - It only accepts an url, and it could be a map or a layer.
 *
 */

module.exports = ImportDataView.extend({

  _DATASOURCE_NAME: '',
  _WINDOW_INTERVAL: 1000, // miliseconds

  _SERVICE_AUTHENTICATION: 0,
  _USER_AUTHENTICATION: 1,

  options: {
    fileExtensions: [],
    type: 'service',
    service: 'bigquery',
    acceptSync: true,
    fileEnabled: false,
    fileAttrs: {
      ext: false,
      title: '',
      description: ''
    }
  },

  initialize: function() {
    this.user = this.options.user;
    this._DATASOURCE_NAME = this.options.service;

    this.model = new UploadModel({
      type: this.options.type,
      service_name: this._DATASOURCE_NAME
    }, {
      user: this.user
    });

    this.template = cdb.templates.getTemplate('common/views/create/listing/import_types/import_bigquery');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template(this.options));
    this.model.set('state', 'idle');
    this._initViews();

    if (this._isServiceAuthentication()) {
      this._prepareModelToUpload();
    }
    return this;
  },

  _initModels: function() {
    if (this._isUserAuthentication()) {
      // Token
      this.token = new ServiceToken(null, { datasource_name: this._DATASOURCE_NAME });
      // Service model
      this.service = new ServiceOauth(null, { datasource_name: this._DATASOURCE_NAME });
    }
  },

  _initBinds: function() {
    this._initModels();
    this.model.bind('change', this._triggerChange, this);
    this.model.bind('change:state', this._checkState, this);

    if (this._isUserAuthentication()) {
      this.token.bind('change:oauth_valid', this._onOauthChange, this);
      this.service.bind('change:url', this._openWindow, this);
      this.add_related_model(this.service);
      this.add_related_model(this.token);
    }
  },

  _initViews: function() {
    // Data header
    var headerView = new HeaderView({
      el: this.$('.ImportPanel-header'),
      model: this.model,
      user: this.user,
      collection: this.collection,
      fileEnabled: this.options.fileEnabled,
      acceptSync: this.options.acceptSync,
      template: 'common/views/create/listing/import_types/data_header_bigquery'
    });
    headerView.render();
    this.addView(headerView);

    if (this._isUserAuthentication()) {
      // Loader
      var loader = new ServiceLoader({
        el: this.$('.ServiceLoader'),
        model: this.model,
        token: this.token,
        service: this.service
      });
      loader.render();
      this.addView(loader);
    }

    // Dataset selected
    var selected = new SelectedDataset({
      el: this.$('.DatasetSelected'),
      user: this.user,
      model: this.model,
      acceptSync: this.options.acceptSync,
      fileAttrs: this.options.fileAttrs
    });
    selected.render();
    this.addView(selected);

    // Data Form
    var formView = new FormView({
      el: this.$('.ImportPanel-form'),
      user: this.user,
      model: this.model,
      template: 'common/views/create/listing/import_types/data_form_bigquery',
      fileEnabled: this.options.fileEnabled,
      oauthMechanism: this.options.oauthMechanism
    });

    formView.render();
    this.addView(formView);

  },

  _onOauthChange: function() {
    if (this.token.get('oauth_valid')) {
      this._prepareModelToUpload();
    }
  },

  _prepareModelToUpload: function() {
    this.model.set('state', 'list');
    this.model.set('service_name', 'connector');
  },

  _openWindow: function() {
    var url = this.service.get('url');
    var self = this;
    var i = window.open(url, null, "menubar=no,toolbar=no,width=600,height=495");
    var e = window.setInterval(function() {
      if (i && i.closed) {
        self._prepareModelToUpload();
        clearInterval(e)
      } else if (!i) {
        self.model.set('state', 'error');
        clearInterval(e)
      }
    }, this._WINDOW_INTERVAL);
  },

  _isUserAuthentication: function() {
    return this.options.oauthMechanism === this._USER_AUTHENTICATION;
  },

  _isServiceAuthentication: function() {
    return this.options.oauthMechanism === this._SERVICE_AUTHENTICATION;
  }

})
