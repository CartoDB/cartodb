var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var ImportDefaultView = require('../import_default_view');
var UploadModel = require('../../../../../background_polling/models/upload_model');
var ServiceHeader = require('./service_header_view');
var ServiceLoader = require('./service_loader_view');
var ServiceList = require('./service_list_view');
var ServiceSelectedFile = require('../import_selected_dataset_view');
var ServiceToken = require('../../../../../service_models/service_token_model');
var ServiceOauth = require('../../../../../service_models/service_oauth_model');
var ServiceCollection = require('./service_items_collection');

/**
 *  Import service view
 *
 *  - Use a service import panel
 *  - It will request login to the service
 *  - If it works, a list of available files will appear.
 *  - Once a file is selected, sync options will appear.
 *
 */

module.exports = ImportDefaultView.extend({

  _DATASOURCE_NAME: '',
  _WINDOW_INTERVAL: 1000, // miliseconds

  className: 'ImportPanel ImportPanelService',

  options: {
    service: '',                  // Name of the service
    showAvailableFormats: false,  // If all available format link should appear or not
    fileExtensions: [],           // File extensions
    acceptSync: false,            // Accept sync this service?
    fileAttrs: {                  // Attributes or changes for service list or selected file:
      ext: false,                 // If files should show extension
      title: 'filename',          // Title attribute
      description: '<%- size %>', // Description attribute
      formatDescription: 'size',  // If any format function should be applied over the description
      headerTemplate: ''          // Header template
    }
  },

  initialize: function() {
    if (!this.options.service) {
      cdb.log.info('Service provider not set for import panel!')
      return false;
    } else {
      this._DATASOURCE_NAME = this.options.service;
    }

    this.user = this.options.user;
    this.model = new UploadModel({
      type: 'service',
      service_name: this._DATASOURCE_NAME
    }, { user: this.user });

    this.template = cdb.templates.getTemplate('common/views/create/listing/import_types/import_service');

    this._initModels();
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template(this.options));
    this._initViews();
    return this;
  },

  _initModels: function() {
    // Token
    this.token = new ServiceToken(null, { datasource_name: this._DATASOURCE_NAME });
    // Service model
    this.service = new ServiceOauth(null, { datasource_name: this._DATASOURCE_NAME });
    // List collection
    this.collection = new ServiceCollection(null, { datasource_name: this._DATASOURCE_NAME });
  },

  _initBinds: function() {
    this.model.bind('change', this._triggerChange, this);
    this.model.bind('change:state', this._checkState, this);
    this.token.bind('change:oauth_valid', this._onOauthChange, this);
    this.service.bind('change:url', this._openWindow, this);
    this.add_related_model(this.service);
    this.add_related_model(this.token);
  },

  _initViews: function() {
    // Header
    var header = new ServiceHeader({
      el: this.$('.ImportPanel-header'),
      user: this.user,
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
    var loader = new ServiceLoader({
      el: this.$('.ServiceLoader'),
      model: this.model,
      token: this.token,
      service: this.service
    });
    loader.render();
    this.addView(loader);

    // List
    var list = new ServiceList({
      el: this.$('.ServiceList'),
      model: this.model,
      collection: this.collection,
      title: this.options.title,
      fileAttrs: this.options.fileAttrs
    });
    list.render();
    this.addView(list);

    // Selected file
    var selected = new ServiceSelectedFile({
      el: this.$('.ServiceSelected'),
      user: this.user,
      model: this.model,
      acceptSync: this.options.acceptSync,
      fileAttrs: this.options.fileAttrs
    });
    selected.render();
    this.addView(selected);
  },

  _onOauthChange: function() {
    if (this.token.get('oauth_valid')) {
      this._getFiles();
    }
  },

  _getFiles: function() {
    var self = this;

    this.model.set('state', 'retrieving');

    this.collection.fetch({
      // data: {
      //   filter: this.options.acceptFileTypes
      // },
      error: function() {
        self.model.set('state', 'error');
      },
      success:  function() {
        self.model.set('state', 'list');
      }
    });
  },

  _checkState: function() {
    if (this.model.get('state') === "list") {
      if (this.collection.size() === 1) {
        var item = this.collection.at(0);
        this.model.set({
          state: 'selected',
          value: item.toJSON(),
          service_item_id: item.get('id')
        });
      }
    }
    if (this.model.get('state') !== "selected") {
      this.model.set({
        value: '',
        service_item_id: '',
        interval: 0
      });
    }
  },

  _openWindow: function() {
    var url = this.service.get('url');
    var self = this;
    var i = window.open(url, null, "menubar=no,toolbar=no,width=600,height=495");
    var e = window.setInterval(function() {
      if (i && i.closed) {
        self._getFiles();
        clearInterval(e)
      } else if (!i) {
        self.model.set('state', 'error');
        clearInterval(e)
      }
    }, this._WINDOW_INTERVAL);
  }

})
