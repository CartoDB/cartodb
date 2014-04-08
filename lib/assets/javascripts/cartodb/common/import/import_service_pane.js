
  /**
   *  Pane for import a service file (such as Dropbox, GDrive, etc)
   *
   *
   *  new cdb.admin.ImportServicePane({ service: 'dropbox' })
   */


  cdb.admin.Token = cdb.core.Model.extend({

    _DATASOURCE_NAME: 'dropbox',

    initialize: function(attrs, opts) {
      if (opts.datasource_name) {
        this._DATASOURCE_NAME = opts.datasource_name;
      }
    },

    urlRoot: function() {
      return '/api/v1/imports/service/' + this._DATASOURCE_NAME + '/token_valid'
    },

    parse: function(r) {
      return r
    }

  });


  cdb.admin.Service = cdb.core.Model.extend({

    _DATASOURCE_NAME: 'dropbox',

    initialize: function(attrs, opts) {
      if (opts.datasource_name) {
        this._DATASOURCE_NAME = opts.datasource_name;
      }
    },

    urlRoot: function() {
      return '/api/v1/imports/service/' + this._DATASOURCE_NAME + '/auth_url'
    },

    parse: function(r) {
      return r
    }

  });

  
  cdb.admin.ServiceItem = cdb.core.Model.extend({
    
    defaults: {

    }

  });


  cdb.admin.ServiceCollection = Backbone.Collection.extend({

    _DATASOURCE_NAME: 'dropbox',

    model: cdb.admin.ServiceItem,

    initialize: function(coll, opts) {
      if (opts.datasource_name) {
        this._DATASOURCE_NAME = opts.datasource_name;
      }
    },

    url: function() {
      return '/api/v1/imports/service/' + this._DATASOURCE_NAME + '/list_files'
    },

  });


  cdb.admin.ImportServicePane = cdb.admin.ImportPane.extend({

    _TEXTS: {},
    _WINDOW_INTERVAL: 1000, // miliseconds
    
    className: "import-pane import-service-pane",

    events: {},

    initialize: function() {
      cdb.admin.ImportPane.prototype.initialize.call(this);

      this.template = this.options.template || cdb.templates.getTemplate('common/views/import/import_service');

      // Token
      this.token = new cdb.admin.Token(null, { datasource_name: this.options.service });

      // Service model
      this.service = new cdb.admin.Service(null, { datasource_name: this.options.service });

      // List collection
      this.collection = new cdb.admin.ServiceCollection(null, { datasource_name: this.options.service });

      this.render();

      this._checkToken();
    },

    render: function() {
      var extensions_list = '';
      // if (this.options.acceptFileTypes) {
      //   extensions_list = "." + this.options.acceptFileTypes.join(' .');
      // }

      // Init smart views

      //- list view

      //- input view

      this.$el.html(this.template({ extensions: "" }));
      return this;
    },

    _initViews: function() {

    },

    _initBinds: function() {
      // Collection fails -> 
      // Oauth fails
    },

    _checkToken: function() {
      var self = this;
      this.token.fetch({
        success: function(r) {
          self._getFiles();
        },
        error: function(e) {
          // self._getOauthURL();
        }
      });
    },

    _getOauthURL: function() {
      this.service.bind('change:url', this._openWindow, this);
      this.service.fetch();
    },

    _getFiles: function() {
      this.collection.fetch();
    },

    _openWindow: function() {
      var url = this.service.get('url');
      var self = this;
      var i = window.open(url, null, "menubar=no,toolbar=no,width=600,height=495");
      var e = window.setInterval(function() {
        if (i.closed) {
          self._getFiles();
          clearInterval(e)
        }
      }, this._WINDOW_INTERVAL);
    }
  });