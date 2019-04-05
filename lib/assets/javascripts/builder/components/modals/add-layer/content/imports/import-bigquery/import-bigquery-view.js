// var FormView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-form-view');
var HeaderView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-header-view');
// var SelectedDatasetView = require('./import-arcgis-selected-dataset-view');
var ImportDataView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-view');
var headerTemplate = require('./import-bigquery-header.tpl');
var formTemplate = require('./import-bigquery-form.tpl');
var template = require('./import-bigquery.tpl');
var UploadModel = require('builder/data/upload-model');

var FormView = require('./import-bigquery-form-view');
var SelectedDataset = require('./import-bigquery-selected-dataset-view');
var ServiceTokenModel = require('../import-service/import-service-token-model');
var ServiceOauthModel = require('../import-service/import-service-oauth-model');
var ServiceLoaderView = require('../import-service/import-service-loader-view');


/**
 *  Import BigQuery panel
 *
 *  - It only accepts an query.
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

  initialize: function(opts) {
    if (!opts.service) throw new Error('service prodiver is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._DATASOURCE_NAME = this.options.service;

    this.model = new UploadModel({
      type: this.options.type,
      service_name: this._DATASOURCE_NAME
    }, {
      userModel: this._userModel,
      configModel: this._configModel
    });

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(template(this.options));
    this.model.set('state', 'idle');
    this._initViews();

    if (this._isServiceAuthentication()) {
      this._prepareModelToUpload();
    }
    return this;
  },

  _initModels: function() {
    if (this._isUserAuthentication()) {
      this._serviceTokenModel = new ServiceTokenModel(null, {
        datasourceName: this._DATASOURCE_NAME,
        configModel: this._configModel
      });
      this._serviceOauthModel = new ServiceOauthModel(null, {
        datasourceName: this._DATASOURCE_NAME,
        configModel: this._configModel
      });
    }
  },

  _initBinds: function() {
    this._initModels();
    this.model.bind('change', this._triggerChange, this);
    this.model.bind('change:state', this._checkState, this);

    if (this._isUserAuthentication()) {
      this._serviceTokenModel.bind('change:oauth_valid', this._onOauthChange, this);
      this._serviceOauthModel.bind('change:url', this._openWindow, this);
      this.add_related_model(this._serviceOauthModel);
      this.add_related_model(this._serviceTokenModel);
    }
  },

  _initViews: function() {
    // Data header
    var headerView = new HeaderView({
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

    if (this._isUserAuthentication()) {
      // Loader
      var loader = new ServiceLoaderView({
        el: this.$('.ServiceLoader'),
        model: this.model,
        serviceTokenModel: this._serviceTokenModel,
        serviceOauthModel: this._serviceOauthModel
      });
      loader.render();
      this.addView(loader);
    }

    // Dataset selected
    var selected = new SelectedDataset({
      el: this.$('.DatasetSelected'),
      userModel: this._userModel,
      model: this.model,
      acceptSync: this.options.acceptSync,
      fileAttrs: this.options.fileAttrs,
      configModel: this._configModel
    });
    selected.render();
    this.addView(selected);

    // Data Form
    var formView = new FormView({
      el: this.$('.ImportPanel-form'),
      userModel: this._userModel,
      model: this.model,
      template: formTemplate,
      fileEnabled: this.options.fileEnabled,
      oauthMechanism: this.options.oauthMechanism
    });

    formView.render();
    this.addView(formView);

  },

  _onOauthChange: function() {
    if (this._serviceTokenModel.get('oauth_valid')) {
      this._prepareModelToUpload();
    }
  },

  _prepareModelToUpload: function() {
    this.model.set('state', 'list');
    this.model.set('service_name', 'connector');
  },

  _openWindow: function() {
    var url = this._serviceOauthModel.get('url');
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
