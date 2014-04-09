
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

    fetch: function() {
      this.trigger("fetch", this);

      // Pass through to original fetch.
      return Backbone.Collection.prototype.fetch.apply(this, arguments);
    },

    parse: function(r) {
      return r.files;
    },

    url: function() {
      return '/api/v1/imports/service/' + this._DATASOURCE_NAME + '/list_files'
    },

  });


  cdb.admin.ImportServiceItem = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click a': '_selectFile'
    },

    initialize: function() {
      _.bindAll(this, '_selectFile');
      this.template = this.options.template || cdb.templates.getTemplate('common/views/import/import_service_item');
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },

    _selectFile: function(e) {
      if (e) this.killEvent(e);
      this.trigger('fileSelected', this.model, this);
    }

  });



  cdb.admin.ImportServiceList = cdb.core.View.extend({

    events: {
      'click a.refresh':  '_getFiles',
      'click a.revoke':   '_revokeToken'
    },

    initialize: function() {
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();

      this.collection.each(function(m){
        var v = new cdb.admin.ImportServiceItem({
          model: m
        });

        v.bind('fileSelected', this._fileSelected, this);

        this.$('ul').append(v.render().el);
        
        this.addView(v);
      }, this);

      this._setRenderState();

      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_getFiles', '_revokeToken', '_triggerError');
      this.collection.bind('fetch', this._setLoadingState, this);
      this.collection.bind('reset', this.render, this);
    },

    _getFiles: function(e) {
      if (e) this.killEvent(e);

      this.collection.fetch({
        data: {
          filter: this.options.acceptFileTypes
        },
        error: this._triggerError
      });
    },

    _triggerError: function() {
      this.trigger('fetchError', this);
    },

    _fileSelected: function(m) {
      this.trigger('fileSelected', m, this);
    },

    _revokeToken: function(e) {
      if (e) this.killEvent(e);
      this.trigger('revokeToken', this);
    },

    _setRenderState: function() {
      this.$('.render').show();
      this.$('.loading').hide();
    },

    _setLoadingState: function() {
      this.$('.render').hide();
      this.$('.loading').show();
    }

  });


  cdb.admin.ImportServiceInput = cdb.core.View.extend({

    events: {
      'click a.service': '_backToList'
    },

    initialize: function() {
      this._initBinds();
    },

    render: function() {
      this.$el.find('p.filename')
        .text(this.model.get('value'))
        .show();

      return this;
    },

    _initBinds: function() {
      this.model.bind('change:value', this.render, this);
    },

    _initViews: function() {
      // infobox
    },

    _backToList: function(e) {
      if (e) this.killEvent();
      this.trigger('backList', this);
    }

  });


  cdb.admin.ImportServicePane = cdb.admin.ImportPane.extend({

    _TEXTS: {},
    _DATASOURCE_NAME: '',
    _WINDOW_INTERVAL: 1000, // miliseconds
    
    className: "import-pane import-service-pane",

    events: {
      'click a.refresh': 'checkToken'
    },

    initialize: function() {

      if (!this.options.service) {
        cdb.log.info('Service provider not set!')
        return false;
      } else {
        this._DATASOURCE_NAME = this.options.service;
      }
      
      this.model = new cdb.core.Model({
        type:             'service',
        value:            '',
        interval:         '0',
        service_name:     this.options.service,
        service_item_id:  ''
      });

      this.template = this.options.template || cdb.templates.getTemplate('common/views/import/import_service');

      this._initModels();
      this._initBinds();

      // Set state from the beginning
      this.model.set('state', 'token');

      this.render();
    },

    render: function() {
      var extensions_list = '';
      if (this.options.acceptFileTypes) {
        extensions_list = "." + this.options.acceptFileTypes.join(' .');
      }

      this.$el.html(
        this.template({
          extensions: extensions_list,
          service:    this._DATASOURCE_NAME
        })
      );

      this._initViews();

      return this;
    },

    _initModels: function() {

      // Token
      this.token = new cdb.admin.Token(null, { datasource_name: this._DATASOURCE_NAME });

      // Service model
      this.service = new cdb.admin.Service(null, { datasource_name: this._DATASOURCE_NAME });

      // List collection
      this.collection = new cdb.admin.ServiceCollection(null, { datasource_name: this._DATASOURCE_NAME });
    },

    _initViews: function() {
      // Init smart views
      
      //- list view
      var list = new cdb.admin.ImportServiceList({
        el:               this.$('div.list'),
        collection:       this.collection,
        acceptFileTypes:  this.options.acceptFileTypes
      });
      // Error fetching files
      list.bind('fetchError',   this._showError, this);
      // When file is selected
      list.bind('fileSelected', this._selectFile, this);
      // Revoking token
      list.bind('tokenRevoked', this._revokeToken, this);

      this.addView(list);

      
      //- input view
      var input = new cdb.admin.ImportServiceInput({
        el:     this.$('div.input'),
        model:  this.model
      });

      // Go back to list
      input.bind('backList', this._changeToList, this);

      this.addView(input);
    },

    _initBinds: function() {
      _.bindAll(this, '_showError', '_changeToList');

      // Oauth fails
      this.model.bind('change:state', this._onStateChange, this);

      // Getting oauth url
      this.service.bind('change:url', this._openWindow, this);
    },

    checkToken: function(e) {
      if (e) this.killEvent(e);

      this._changeModel('token', '');

      var self = this;
      this.token.fetch({
        success: function(r) {
          if (r.get('oauth_valid')) {
            self._getFiles();  
          } else {
            self._getOauthURL();
          }
        },
        error: function(e) {
          self._getOauthURL();
        }
      });
    },

    _changeToList: function() {
      this._changeModel('list', '');
    },

    _changeModel: function(state, value) {
      this.model.set({
        state:            state,
        value:            value,
        service_item_id:  value
      });

      // Trigger change to parent view
      this.trigger('valueChange', this.model.toJSON());
    },

    _onStateChange: function(m,val) {
      this.$('.service-state').hide();
      this.$('.service-state.' + val).show();
    },

    _selectFile: function(m) {
      this._changeModel('input', m.get('id'));
    },

    _showError: function() {
      this.model.set('state', 'error');
    },

    _getOauthURL: function() {
      this._changeModel('oauth', '');

      this.service.set({
        url: ''
      }, { silent: true });
      this.service.fetch();
    },

    _getFiles: function() {
      this._changeModel('list', '');

      this.collection.fetch({
        data: {
          filter: this.options.acceptFileTypes
        },
        error: this._showError
      });
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
    },

    submitUpload: function() {
      if (this.model.get('value')) {
        this.trigger('fileChosen', this.model.toJSON());
      }
    }
  });