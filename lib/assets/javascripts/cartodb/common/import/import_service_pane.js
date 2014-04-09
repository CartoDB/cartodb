
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
      id: '',
      filename: '',
      checksum: '',
      service: '',
      size: '',
      title: ''
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

    _TEXTS: {
      empty: _t('No files with the required extensions are available in your account')
    },

    initialize: function() {
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();
      this.$('ul').html('');

      // No items?
      if (this.collection.size() === 0) {
        this.$('ul').append($('<li>').addClass('empty').text(this._TEXTS.empty))
        return false;
      }

      // Render items
      this.collection.each(function(m){
        var v = new cdb.admin.ImportServiceItem({
          model: m
        });

        v.bind('fileSelected', this._fileSelected, this);

        this.$('ul').append(v.render().el);
        
        this.addView(v);
      }, this);

      // Add new custom scroll
      this.custom_scroll = new cdb.admin.CustomScrolls({
        el:     this.$('ul'),
        parent: this.$el
      });

      this.addView(this.custom_scroll);

      return this;
    },

    _initBinds: function() {
      this.collection.bind('reset', this.render, this);
    },

    _fileSelected: function(m) {
      this.trigger('fileSelected', m, this);
    }

  });



  cdb.admin.ImportServicePane = cdb.admin.ImportPane.extend({

    _TEXTS: {},
    _DATASOURCE_NAME: '',
    _WINDOW_INTERVAL: 1000, // miliseconds
    
    className: "import-pane import-service-pane",

    events: {
      'click a.service-button': '_checkToken',
      'click a.change':         '_showList'
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
      
      //- list view
      var list = new cdb.admin.ImportServiceList({
        el:               this.$('div.list'),
        collection:       this.collection,
        acceptFileTypes:  this.options.acceptFileTypes
      });
      // When file is selected
      list.bind('fileSelected', this._selectFile, this);
      
      this.addView(list);

      //- input view
      this.import_info = new cdb.admin.ServiceImportInfo({
        el:         this.$('div.infobox'),
        model:      this.model,
        acceptSync: this.options.acceptSync
      });

      // If click over upgrade link
      this.import_info.bind('showUpgrade', function() {
        this.trigger('showUpgrade');
      }, this);
      
      this.addView(this.import_info);
    },

    _initBinds: function() {
      _.bindAll(this, '_showError', '_showList', '_changeToList');

      // Oauth fails
      this.model.bind('change:state', this._onStateChange, this);

      // Getting oauth url
      this.service.bind('change:url', this._openWindow, this);
    },

    _checkToken: function(e) {
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

    _changeToList: function(e) {
      if (e) this.killEvent(e);
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

      var actions = cdb.admin.service_states[val];
      var self = this;

      if (!actions) {
        cdb.log.info('service state not defined');
        return false;
      }

      // Loading?
      this.$('.loader')[ actions.loader ? 'show' : 'hide']();

      // Show list?
      this.$('div.list')[ actions.list ? 'show' : 'hide']();
      this.$('div.input')[ actions.list ? 'hide' : 'show']();

      // Show message?
      var $msg = this.$('p.msg');
      $msg[actions.msg ? 'show' : 'hide' ]();
      if (actions.msg) $msg.text(_.template(actions.msg)({ service: this._DATASOURCE_NAME }))

      // Show file?
      var $file = this.$('p.filename');
      $file[actions.file ? 'show' : 'hide' ]();
      if (actions.file) {
        $file
          .text(this.model.get('value'))
          .attr('title', this.model.get('value'));
      }

      // Set service button
      var $button = this.$('.service-button');
      _.each(actions.service, function(value,action) {
        $button[action](value);
      });

      // Set change button
      var $change = this.$('.change');
      _.each(actions.change, function(value,action) {
        $change[action](value);
      });

      // Show info tab?
      this.import_info.activeTab(actions.info);
    },

    _selectFile: function(m) {
      this._changeModel('chosen', m.get('id'));
    },

    _showError: function() {
      this._changeModel('error', '');
    },

    _showList: function() {
      this._changeModel('retrieved', '');
    },

    _getOauthURL: function() {
      this._changeModel('oauth', '');

      this.service.set({
        url: ''
      }, { silent: true });
      this.service.fetch();
    },

    _getFiles: function() {
      this._changeModel('retrieving', '');

      this.collection.fetch({
        data: {
          filter: this.options.acceptFileTypes
        },
        error:    this._showError,
        success:  this._showList
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