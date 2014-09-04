
  /**
   *  Content for CreateDialog class
   *    - It will render desired tabs for the dialog.
   *    - It will manage communication between tabs and dialog.
   *
   */
  
  cdb.common.CreateDialog.Content = cdb.core.View.extend({

    className: 'create-dialog-content',

    _TABS: {
      layer:    {
        method: '_genLayerPane',
        title:  _t('Select layer'),
      },
      file:     {
        method: '_genFilePane',
        title:  _t('Data file')
      },
      gdrive:   {
        method: '_genGDrivePane',
        title:  _t('Google Drive'),
        label:  _t('(Google SpreadSheet, .CSV)')
      },
      dropbox:  {
        method: '_genDropboxPane',
        title:  _t('Dropbox')
      },
      twitter:  {
        method:   '_genTwitterPane',
        title:    _t('Twitter'),
        template: 'common/views/import/import_twitter_disabled'
      },
      scratch:  {
        method: '_genScratchPane',
        title:  _t('Empty table')
      },
      success:     {
        method: '_genSuccessPane',
        title:  _t('Ok')
      },
      error:     {
        method: '_genErrorPane',
        title:  _t('There has been an error with your import')
      },
    },

    _TAB_TEMPLATE: "<li class='create-tab <%= name %>'><a href='#/<%= name %>' class='<%= name %>'><i class='create-icon <%= name %>'></i><span><%= title %></span></a></li>",

    _TEXTS: {
      maxFileSize: _t('Looks like your file is too big for your available quota. <a \
                      href="#/showUpgrade" class="button green small upgrade">Upgrade now</a>'),
      limits: {
        key:      _t('<%= name %> key is not specified and panel can\'t be enabled'),
        account:  _t('<%= name %> data source is not available in your plan. Please upgrade'),
        limits:   _t('You\'ve reached the table limit for your account. Please upgrade'),
        credits:  _t('You\'ve reached the available <%= name %> credits for your account this month'),
      }
    },

    events: {
      'click .stop': '_onStopUpload'
    },

    initialize: function() {
      // Set local vars
      this.tabs = this.options.tabs || [];
      this.option = this.options.option;
      this.uploader = this.options.uploader;
      this.user = this.options.user;
      this.$dialog = this.options.$dialog;
      this.tooltips = []; // Tabs with tooltips

      this.template = cdb.templates.getTemplate(this.options.template || 'common/views/create_dialog/create_dialog_content');
    },

    render: function() {
      this._destroyBinds();
      this._destroyTooltips();
      this.clearSubViews();
      this.$el.empty();

      // Append template content
      this.$el.append(this.template());
      // Generate tabs!
      this._genTabs();
      // Generate panes!
      this._genPanes();
      // Set binds
      this._setBinds();
      // Create actions controller view
      this._genActionsController();
      // Activate desired option!
      this._setSelectedTab(this.option);

      return this;
    },

    ////////////////////
    // TABS && PANES! //
    ////////////////////

    _genTabs: function() {
      var tabs = "";
      var self = this;
      
      _.each(this.tabs, function(t) {
        if (self._TABS[t]) {
          tabs += _.template(self._TAB_TEMPLATE)({ name: t, title: self._TABS[t].title });
        } else {
          cdb.log.info('Create tab ' + t + ' doesn\'t exist');  
        }
      });

      this.$('.create-tabs').append(tabs);

      // Create tabs
      this.create_tabs = new cdb.admin.Tabs({
        el:     this.$('.create-tabs'),
        slash:  true
      });
      this.addView(this.create_tabs);
    },

    _genPanes: function() {
      var self = this;

      // Create TabPane
      this.create_panes = new cdb.ui.common.TabPane({
        el: this.$(".create-panes")
      });
      this.addView(this.create_panes);

      // Link tabs with panes
      this.create_tabs.linkToPanel(this.create_panes);

      // Render desired panes!
      _.each(this.tabs, function(t) {
        if (self._TABS[t]) {
          var item = self[self._TABS[t].method]();
          if (item) {
            self.create_panes.addTab(t, item);
            self.addView(item);  
          } 
        } else {
          cdb.log.info('Create pane ' + t + ' doesn\'t exist');  
        }
      });
    },

    _genFilePane: function() {
      // Check if user can create or import a new file
      if (!this._canCreate()) {
        this._setFailedTab('file', 'limits');
        return false;
      }

      var filePane = new cdb.admin.ImportFilePane({
        maxFileSize:      this.uploader.maxFileSize,
        maxUploadFiles:   this.uploader.maxUploadFiles,
        acceptFileTypes:  this.uploader.acceptFileTypes,
        acceptSync:       this.uploader.acceptSync
      });
      
      filePane.bind('fileChosen',  this._onValueChosen, this);
      filePane.bind('valueChange', this._onValueChange, this);
      filePane.bind('showUpgrade', this._onShowUpgrade, this);
      
      return filePane;
    },

    _genLayerPane: function() {
      var layerPane = new cdb.admin.ImportLayerPane({
        user: this.user
      });

      layerPane.bind('valueChange', this._onValueChange, this);

      return layerPane;
    },

    _genGDrivePane: function() {
      if (!cdb.config.get('oauth_gdrive')) {
        this._setFailedTab('gdrive', 'key');
        return false;
      }

      // Check if user can create or import a new file
      if (!this._canCreate()) {
        this._setFailedTab('gdrive', 'limits');
        return false;
      }

      var gdrivePane = new cdb.admin.ImportServicePane({
        service:          'gdrive',
        acceptFileTypes:  this.uploader.acceptFileTypes,
        label:            this._TABS['gdrive'].label,
        acceptSync:       this.uploader.acceptSync
      });

      gdrivePane.bind('fileChosen',   this._onValueChosen,    this);
      gdrivePane.bind('valueChange',  this._onValueChange,    this);
      gdrivePane.bind('showUpgrade',  this._onShowUpgrade,    this);
      gdrivePane.bind('changeSize',  this._onPaneChangeSize, this);
      
      return gdrivePane;
    },

    _genDropboxPane: function() {
      if (!cdb.config.get('oauth_dropbox')) {
        this._setFailedTab('dropbox', 'key');
        return false;
      }

      // Check if user can create or import a new file
      if (!this._canCreate()) {
        this._setFailedTab('dropbox', 'limits');
        return false;
      }

      var dropboxPane = new cdb.admin.ImportServicePane({
        service:          'dropbox',
        acceptFileTypes:  this.uploader.acceptFileTypes,
        acceptSync:       this.uploader.acceptSync
      });

      dropboxPane.bind('fileChosen',  this._onValueChosen,    this);
      dropboxPane.bind('valueChange', this._onValueChange,    this);
      dropboxPane.bind('showUpgrade', this._onShowUpgrade,    this);
      dropboxPane.bind('changeSize',  this._onPaneChangeSize, this);
      
      return dropboxPane;
    },

    _genTwitterPane: function() {
      if (!this._canCreate()) {
        this._setFailedTab('twitter', 'limits');
        return false;
      }

      // Check if user have twitter datasource enabled!
      if (!cdb.config.get('datasource_search_twitter')) {
        this._setFailedTab('twitter', 'key');
        return false;
      }

      // Check if user can create or import a new file or user has
      // enough rights to enable twitter!
      if (!this.user.get('twitter').enabled) {

        var messagePane = new cdb.admin.ImportMessagePane({
          className: 'import-message-pane twitter-message-pane',
          template: this._TABS['twitter'].template
        });

        return messagePane;
      }

      // Check if user can create or import a new file or user has
      // enough rights to enable twitter!
      if (( this.user.get('twitter').quota - this.user.get('twitter').monthly_use ) <= 0 && this.user.get('twitter').hard_limit) {
        this._setFailedTab('twitter', 'credits');
        return false;
      }      

      var twitterPane = new cdb.admin.ImportTwitterPane({
        user:       this.user,
        acceptSync: this.uploader.acceptSync
      });

      twitterPane.bind('fileChosen',  this._onValueChosen, this);
      twitterPane.bind('valueChange', this._onValueChange, this);
      twitterPane.bind('showUpgrade', this._onShowUpgrade, this);
      twitterPane.bind('changeSize',  this._onPaneChangeSize, this);

      return twitterPane;
    },

    _genScratchPane: function() {
      // Check if user can create
      if (!this._canCreate()) {
        this._setFailedTab('scratch', 'limits');
        return false;
      }

      return new cdb.admin.ImportEmptyPane();
    },

    _genSuccessPane: function() {
      return new cdb.admin.ImportSuccessPane({
        model: this.model
      });
    },

    _genErrorPane: function() {
      return new cdb.admin.ImportErrorPane({
        model: this.model
      });
    },

    _genActionsController: function() {
      var actions = new cdb.common.CreateDialog.Actions({
        tabs:     this.create_tabs,
        panes:    this.create_panes,
        model:    this.model,
        states:   this.options.states,
        $dialog:  this.$dialog
      });
      this.addView(actions);
    },

    _setSelectedTab: function(tab) {
      if (this._TABS[tab]) {
        this.create_panes.active(tab);
      } else if (this.tabs && this.tabs.length > 0) {
        this.create_panes.active(this.tabs[0]);
      } else {
        cdb.log.info('No create-tabs no fun');
      }
    },

    _setFailedTab: function(tab, type) {
      var $tab = this.create_tabs.getTab(tab)
      $tab.addClass('disabled');
      this._createTooltip(tab, type);
    },

    _createTooltip: function(tab, type) {
      var $tab = this.create_tabs.getTab(tab);
      var self = this;

      $tab.tipsy({
        gravity: 's',
        fade: true,
        title: function() {
          return _.template(self._TEXTS.limits[type])({ name: self._TABS[tab].title })
        }
      });

      this.tooltips.push($tab);
    },

    _destroyTooltips: function() {
      _.each(this.tooltips, function($el) {
        if ($el.length > 0 && $el.data('tipsy')) {
          $el.unbind('mouseenter mouseleave');
          $el.data('tipsy').$element.remove();
        }
      });

      this.tooltips = [];
    },

    _setBinds: function() {
      this.create_panes.bind('tabEnabled',  this._onTabChange, this);
      this.model.bind('change:state',       this._onStateChange, this);
    },

    _destroyBinds: function() {
      if (this.create_panes) {
        this.create_panes.unbind('tabEnabled', null, this);  
      }
    },

    
    ////////////
    // Events //
    ////////////

    _onTabChange: function(tabName) {
      if (tabName !== "error") {
        var values = this.create_panes.getPane(tabName).getValue()
        var upload = _.extend(values, { progress: 0 });

        this.model.set({
          option: tabName,
          upload: upload
        });  
      }
    },

    _onStateChange: function(m, c) {
      if (this.model.get('state') === "added") {
        var pane = this.create_panes.getPane(this.model.get('option'));
        pane.setValue(this.model.get('upload'));
      }
      if (this.model.get('state') === "error") {
        this.create_panes.active('error');
      }
    },

    _onValueChange: function() {
      var values = this.create_panes.getActivePane().getValue();
      var upload = _.extend(values, { progress: 0 });

      this.model.set({
        upload: upload
      });
    },

    _onValueChosen: function(d) {
      // Type file?
      this.model.set({
        state: 'selected',
        upload: d
      })
    },

    _onPaneChangeSize: function() {
      this.trigger('changeSize', this);
    },

    _onShowUpgrade: function() {
      this.trigger('showUpgrade', this);
    },

    _onStopUpload: function(e) {
      if (e) this.killEvent(e);

      this.model.set({
        state: 'reset'
      });
    },


    // Help function to know if user can create a new 
    // table/layer from scratch or from an import (file, twitter, etc)
    _canCreate: function() {
      if (this.user.get('table_quota') === null || this.user.get('remaining_table_quota') > 0) {
        return true
      }

      return false;
    },

    clean: function() {
      this._destroyBinds();
      this._destroyTooltips();
      cdb.core.View.prototype.clean.call(this);
    }

  });

