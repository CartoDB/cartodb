
  /**
   *  Pane for import a service file (such as Dropbox, GDrive, etc)
   *
   *
   *  new cdb.admin.ImportServicePane({ service: 'dropbox' })
   */



  cdb.admin.ImportServicePane = cdb.admin.ImportPane.extend({

    defaults: {
      filename_field: "id"
    },

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

      this.options = _.extend(this.defaults, this.options);

      this.model = new cdb.core.Model({
        type:             'service',
        value:            '',
        interval:         '0',
        service_name:     this.options.service,
        service_item_id:  '',
        valid:            false
      });

      this.template = cdb.templates.getTemplate(this.options.template || 'old_common/views/import/import_service');

      this._initModels();
      this._initBinds();

      this.render();
    },

    render: function() {

      this.$el.html(
        this.template({
          label:              this.options.label  || '',
          show_formats_link:  this.options.show_formats_link === undefined ? true : false,
          item_kind:          this.options.item_kind || 'file',
          service:            this._DATASOURCE_NAME
        })
      );

      this._initViews();

      return this;
    },

    _initModels: function() {
      // Token
      this.token = new cdb.admin.ServiceToken(null, { datasource_name: this._DATASOURCE_NAME });

      // Service model
      this.service = new cdb.admin.ServiceOauth(null, { datasource_name: this._DATASOURCE_NAME });

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

      // Interval change
      this.model.bind('change:interval', this._triggerChange, this);

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

    _changeModel: function(state, value, extra) {

      var values = _.extend({
        state:            state,
        value:            value,
        service_item_id:  value,
        valid:            state === "chosen" ? true : false
      }, extra);

      this.model.set(values);

      this._triggerChange();
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
          .text(this.model.get("filename"))
          .attr('title', this.model.get('filename'));
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
      this._changeModel('chosen', m.get("id"), { filename: m.get(this.options.filename_field) });
    },

    _showError: function() {
      this._changeModel('error', '');
    },

    _showList: function(e) {
      if (e) this.killEvent(e);
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
        if (i && i.closed) {
          self._getFiles();
          clearInterval(e)
        } else if (!i) {
          self._changeModel('error', '');
          clearInterval(e)
        }
      }, this._WINDOW_INTERVAL);
    },

    _triggerChange: function() {
      // Trigger change to parent view
      this.trigger('valueChange', this.model.toJSON());
      this.trigger('changeSize', this);
    },

    submitUpload: function() {
      if (this.model.get('value')) {
        this.trigger('fileChosen', this.model.toJSON());
      }
    }

  });
