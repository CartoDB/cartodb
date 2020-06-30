const AuthModel = require('./import-bigquery-auth-model');
const HeaderView = require('./import-bigquery-header-view');
const ImportDataView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-view');
const headerTemplate = require('./import-bigquery-header.tpl');
const template = require('./import-bigquery.tpl');
const UploadModel = require('builder/data/upload-model');

const FormView = require('./import-bigquery-form-view');
const SelectedDataset = require('./import-bigquery-selected-dataset-view');
const ServiceTokenModel = require('../import-service/import-service-token-model');
const ServiceOauthModel = require('../import-service/import-service-oauth-model');
const ServiceLoaderView = require('../import-service/import-service-loader-view');

/**
 *  Import BigQuery panel
 *
 *  - It only accepts a query.
 *
 */

module.exports = ImportDataView.extend({
  _DATASOURCE_NAME: '',
  _WINDOW_INTERVAL: 1000, // miliseconds

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

  initialize: function (opts) {
    if (!opts.service) throw new Error('service provider is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._DATASOURCE_NAME = this.options.service;
    this._authModel = new AuthModel({ configModel: this._configModel });

    this.model = new UploadModel(
      {
        type: this.options.type,
        service_name: this._DATASOURCE_NAME
      },
      {
        userModel: this._userModel,
        configModel: this._configModel
      }
    );

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template(this.options));
    this.model.set('state', 'idle');
    this._initViews();

    if (this._authModel.isServiceAuthentication()) {
      // if enabled, the oauth flow is omitted
      this._prepareModelToUpload();
    }

    return this;
  },

  _initModels: function () {
    this._serviceTokenModel = new ServiceTokenModel(null, {
      datasourceName: this._DATASOURCE_NAME,
      configModel: this._configModel
    });
    this._serviceOauthModel = new ServiceOauthModel(null, {
      datasourceName: this._DATASOURCE_NAME,
      configModel: this._configModel
    });
  },

  _initBinds: function () {
    this._initModels();
    this.model.bind('change', this._triggerChange, this);
    this.model.bind('change:state', this._checkState, this);

    if (this._authModel.isUserAuthentication()) {
      this._serviceTokenModel.bind(
        'change:oauth_valid',
        this._onOauthChange,
        this
      );
      this._serviceOauthModel.bind('change:url', this._openWindow, this);
      this.add_related_model(this._serviceOauthModel);
      this.add_related_model(this._serviceTokenModel);
    }
  },

  _initViews: function () {
    this._addDataHeaderView();

    if (this._authModel.isUserAuthentication()) {
      this._addServiceLoaderView();
    }

    this._addSelectedDatasetView();
    this._addFormView();
  },

  _addDataHeaderView: function () {
    // Data header
    const headerView = new HeaderView({
      el: this.$('.ImportPanel-header'),
      model: this.model,
      userModel: this._userModel,
      collection: this.collection,
      fileEnabled: this.options.fileEnabled,
      acceptSync: this.options.acceptSync,
      template: headerTemplate
    });
    headerView.render();
    this.addView(headerView);
  },

  _addServiceLoaderView: function () {
    // Loader
    const loader = new ServiceLoaderView({
      el: this.$('.ServiceLoader'),
      model: this.model,
      serviceTokenModel: this._serviceTokenModel,
      serviceOauthModel: this._serviceOauthModel
    });
    loader.render();
    this.addView(loader);
  },

  _addSelectedDatasetView: function () {
    // Dataset selected
    const selected = new SelectedDataset({
      el: this.$('.DatasetSelected'),
      userModel: this._userModel,
      model: this.model,
      acceptSync: this.options.acceptSync,
      fileAttrs: this.options.fileAttrs,
      configModel: this._configModel
    });
    selected.render();
    this.addView(selected);
  },

  _addFormView: function () {
    // Data Form
    const formView = new FormView({
      el: this.$('.ImportPanel-form'),
      userModel: this._userModel,
      configModel: this._configModel,
      authModel: this._authModel,
      model: this.model,
      fileEnabled: this.options.fileEnabled
    });
    formView.render();
    this.addView(formView);
  },

  _onOauthChange: function () {
    if (this._serviceTokenModel.get('oauth_valid')) {
      this._prepareModelToUpload();
    }
  },

  _prepareModelToUpload: function () {
    this._checkConnection();
  },

  _checkConnection: function () {
    const version = this._configModel.urlVersion('connectors');
    const baseUrl = this._configModel.get('base_url');
    const self = this;

    fetch(baseUrl + '/api/' + version + '/connectors/bigquery/connect/')
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data && data.connected) {
          self.model.set('state', 'list');
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

  _openWindow: function () {
    var url = this._serviceOauthModel.get('url');
    var self = this;
    var i = window.open(
      url,
      null,
      'menubar=no,toolbar=no,width=600,height=495'
    );
    var e = window.setInterval(function () {
      if (i && i.closed) {
        self._prepareModelToUpload();
        clearInterval(e);
      } else if (!i) {
        self.model.set('state', 'error');
        clearInterval(e);
      }
    }, this._WINDOW_INTERVAL);
  }
});
