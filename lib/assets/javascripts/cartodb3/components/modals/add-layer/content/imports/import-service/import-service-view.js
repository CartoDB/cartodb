var ImportView = require('../import-view');
var UploadModel = require('../../../../../../data/upload-model');
var ServiceHeaderView = require('./import-service-header-view');
var ServiceLoaderView = require('./import-service-loader-view');
var ServiceListView = require('./import-service-list-view');
var ServiceSelectedFileView = require('../import-selected-dataset-view');
var ServiceTokenModel = require('./import-service-token-model');
var ServiceOauthModel = require('./import-service-oauth-model');
var ServiceCollection = require('./import-service-items-collection');
var template = require('./import-service.tpl');
var WINDOW_INTERVAL = 1000; // miliseconds

/**
 *  Import service view
 *
 *  - Use a service import panel
 *  - It will request login to the service
 *  - If it works, a list of available files will appear.
 *  - Once a file is selected, sync options will appear.
 *
 */

module.exports = ImportView.extend({
  _DATASOURCE_NAME: 'dropbox',

  className: 'ImportPanel ImportPanelService',

  options: {
    service: '', // Name of the service
    showAvailableFormats: false, // If all available format link should appear or not
    fileExtensions: [], // File extensions
    acceptSync: false, // Accept sync this service?
    fileAttrs: { // Attributes or changes for service list or selected file:
      ext: false, // If files should show extension
      title: 'filename', // Title attribute
      description: '<%- size %>', // Description attribute
      formatDescription: 'size', // If any format function should be applied over the description
      headerTemplate: '' // Header template
    }
  },

  initialize: function (opts) {
    if (!opts.service) throw new Error('service prodiver is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._DATASOURCE_NAME = this.options.service;

    this.model = new UploadModel({
      type: 'service',
      service_name: this._DATASOURCE_NAME
    }, {
      userModel: this._userModel,
      configModel: this._configModel
    });

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template(this.options));
    this._initViews();
    return this;
  },

  _initModels: function () {
    // Token
    this._serviceTokenModel = new ServiceTokenModel(null, {
      datasourceName: this._DATASOURCE_NAME,
      configModel: this._configModel
    });
    // Service model
    this._serviceOauthModel = new ServiceOauthModel(null, {
      datasourceName: this._DATASOURCE_NAME,
      configModel: this._configModel
    });
    // List collection
    this.collection = new ServiceCollection(null, {
      datasourceName: this._DATASOURCE_NAME,
      configModel: this._configModel
    });
  },

  _initBinds: function () {
    this.model.bind('change', this._triggerChange, this);
    this.model.bind('change:state', this._checkState, this);
    this._serviceTokenModel.bind('change:oauth_valid', this._onOauthChange, this);
    this._serviceOauthModel.bind('change:url', this._openWindow, this);
    this.add_related_model(this._serviceOauthModel);
    this.add_related_model(this._serviceTokenModel);
  },

  _initViews: function () {
    // Header
    var header = new ServiceHeaderView({
      el: this.$('.ImportPanel-header'),
      userModel: this._userModel,
      model: this.model,
      collection: this.collection,
      title: this.options.title,
      showAvailableFormats: this.options.showAvailableFormats,
      fileExtensions: this.options.fileExtensions,
      acceptSync: this.options.acceptSync,
      template: this.options.headerTemplate
    });
    header.render();
    this.addView(header);

    // Loader
    var loader = new ServiceLoaderView({
      el: this.$('.ServiceLoader'),
      model: this.model,
      serviceTokenModel: this._serviceTokenModel,
      serviceOauthModel: this._serviceOauthModel
    });
    loader.render();
    this.addView(loader);

    // List
    var list = new ServiceListView({
      el: this.$('.ServiceList'),
      model: this.model,
      collection: this.collection,
      title: this.options.title,
      fileAttrs: this.options.fileAttrs
    });
    list.render();
    this.addView(list);

    // Selected file
    var selected = new ServiceSelectedFileView({
      el: this.$('.ServiceSelected'),
      userModel: this._userModel,
      model: this.model,
      acceptSync: this.options.acceptSync,
      fileAttrs: this.options.fileAttrs,
      configModel: this._configModel
    });
    selected.render();
    this.addView(selected);
  },

  _onOauthChange: function () {
    if (this._serviceTokenModel.get('oauth_valid')) {
      this._getFiles();
    }
  },

  _getFiles: function () {
    var self = this;

    this.model.set('state', 'retrieving');

    this.collection.fetch({
      error: function () {
        self.model.set('state', 'error');
      },
      success: function () {
        self.model.set('state', 'list');
      }
    });
  },

  _checkState: function () {
    if (this.model.get('state') === 'list') {
      if (this.collection.size() === 1) {
        var item = this.collection.at(0);
        this.model.set({
          state: 'selected',
          value: item.toJSON(),
          service_item_id: item.get('id')
        });
      }
    }
    if (this.model.get('state') !== 'selected') {
      this.model.set({
        value: '',
        service_item_id: '',
        interval: 0
      });
    }
  },

  _openWindow: function () {
    var url = this._serviceOauthModel.get('url');
    var self = this;
    var i = window.open(url, null, 'menubar=no,toolbar=no,width=600,height=495');
    var e = window.setInterval(function () {
      if (i && i.closed) {
        self._getFiles();
        clearInterval(e);
      } else if (!i) {
        self.model.set('state', 'error');
        clearInterval(e);
      }
    }, WINDOW_INTERVAL);
  }

});
