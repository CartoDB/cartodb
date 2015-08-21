
  /**
   *  Content for CreateDialog class
   *    - It will render desired tabs for the dialog.
   *    - It will manage communication between tabs and dialog.
   *
   */

  cdb.common.CreateDialog.Content = cdb.core.View.extend({

    className: 'create-dialog-content',

    // Add also to lib/assets/javascripts/cartodb/common/create_table.js
    _TABS: {
      layer:    {
        method: '_genLayerPane',
        title:  _t('Select layer')
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
        label:  _t('(CSV, XLS, KML, GPX)'),
        title:  _t('Dropbox')
      },
      twitter:  {
        method:   '_genTwitterPane',
        title:    _t('Twitter'),
        template: 'old_common/views/import/import_twitter_disabled'
      },
      scratch:  {
        method: '_genScratchPane',
        title:  _t('Empty dataset')
      },
      instagram: {
        type:     'other',
        method:   '_genInstagramPane',
        title:    _t('Instagram')
      },
      arcgis: {
        type:     'other',
        method:   '_genArcgisPane',
        title:    _t('ArcGIS Server'),
        template: 'old_common/views/import/import_arcgis_disabled'
      },
      salesforce: {
        type:     'other',
        method:   '_genSalesforcePane',
        title:    _t('Salesforce'),
        template: 'old_common/views/import/import_salesforce_disabled'
      },
      mailchimp: {
        type:     'other',
        method:   '_genMailchimpPane',
        title:    _t('MailChimp'),
        label:    ' ',
        show_formats_link: false,
        template: 'old_common/views/import/import_mailchimp_disabled'
      },
      success:     {
        method: '_genSuccessPane',
        title:  _t('Ok')
      },
      error:     {
        method: '_genErrorPane',
        title:  _t('There has been an error with your import')
      }
    },

    // title is safe since static strings given by view
    _TAB_TEMPLATE: "<li class='create-tab <%- name %>'><a href='#/<%- name %>' class='<%- name %>'><i class='create-icon <%- name %>'></i><span><%= title %></span></a></li>",

    _TEXTS: {
      maxFileSize: _t('Looks like your file is too big for your available quota. <a \
                      href="#/showUpgrade" class="button green small upgrade">Upgrade now</a>'),
      limits: {
        key:      _t('<%- name %> key is not specified and panel can\'t be enabled'),
        account:  _t('<%- name %> data source is not available in your plan. Please upgrade'),
        limits:   _t('You\'ve reached the limits for your account. Please upgrade'),
        credits:  _t('You\'ve reached the available <%- name %> credits for your account this month'),
      }
    },

    events: {
      'click .stop': '_onStopUpload',
      'click .create-tabs-navigation a.popular': '_onNavTabClick',
      'click .create-tabs-navigation a.other': '_onNavTabClick'
    },

    initialize: function() {
      // Set local vars
      this.tabs = this.options.tabs || [];  // User tabs selection
      this.enabled_tabs = this.tabs;        // Enabled tabs
      this.option = this.options.option;
      this.uploader = this.options.uploader;
      this.user = this.options.user;
      this.$dialog = this.options.$dialog;

      this.template = cdb.templates.getTemplate(this.options.template || 'old_common/views/create_dialog/create_dialog_content');

      this._initBinds();
    },

    render: function() {
      this._destroyBinds();
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

    _initBinds: function() {
      _.bindAll(this, '_onNavTabClick', '_onStopUpload');
    },


    ////////////////////
    // TABS && PANES! //
    ////////////////////

    _genTabs: function() {
      var self = this;
      var popular_tabs = "";
      var other_tabs = "";

      _.each(this.tabs, function(t) {
        if (self._TABS[t]) {

          if (!self._TABS[t].type) {
            popular_tabs += _.template(self._TAB_TEMPLATE)({ name: t, title: self._TABS[t].title });
          } else {
            other_tabs += _.template(self._TAB_TEMPLATE)({ name: t, title: self._TABS[t].title });
          }

        } else {
          cdb.log.info('Create tab ' + t + ' doesn\'t exist');
        }
      });

      this.$('.create-tabs > .popular').append(popular_tabs);
      this.$('.create-tabs > .other').append(other_tabs);

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
        label:            this._TABS['dropbox'].label,
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

        // Tab not available, so we remove it
        this.enabled_tabs = _.without(this.enabled_tabs, 'twitter');

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

    _genInstagramPane: function() {
      if (!cdb.config.get('oauth_instagram')) {
        this._setFailedTab('instagram', 'key');
        return false;
      }

      // Check if user can create or import a new file
      if (!this._canCreate()) {
        this._setFailedTab('instagram', 'limits');
        return false;
      }

      var instagramPane = new cdb.admin.ImportInstagramPane({
        service:    'instagram',
        template:   'old_common/views/import/import_service_instagram',
        acceptSync: false
      });

      instagramPane.bind('fileChosen',  this._onValueChosen,    this);
      instagramPane.bind('valueChange', this._onValueChange,    this);
      instagramPane.bind('showUpgrade', this._onShowUpgrade,    this);
      instagramPane.bind('changeSize',  this._onPaneChangeSize, this);

      return instagramPane;
    },

    _genArcgisPane: function() {
      if (!this._canCreate()) {
        this._setFailedTab('arcgis', 'limits');
        return false;
      }

      // Check if user have sync capabilities enabled
      if (this.user.get('actions') && !this.user.get('actions').arcgis_datasource) {

        // Tab not available, so we remove it
        this.enabled_tabs = _.without(this.enabled_tabs, 'arcgis');

        var messagePane = new cdb.admin.ImportMessagePane({
          className:  'import-message-pane arcgis-message-pane',
          template:   this._TABS['arcgis'].template
        });

        return messagePane;
      }

      var arcgisPane = new cdb.admin.ImportArcGISPane({
        template:     'old_common/views/import/import_arcgis',
        user:         this.user,
        type:         'service',
        service_name: 'arcgis',
        acceptSync:   this.user.get('actions') && this.user.get('actions').sync_tables
      });

      arcgisPane.bind('fileChosen',  this._onValueChosen, this);
      arcgisPane.bind('valueChange', this._onValueChange, this);
      arcgisPane.bind('changeSize',  this._onPaneChangeSize, this);

      return arcgisPane;
    },

    _genSalesforcePane: function() {

      // Check if user can create or import a new file
      if (!this._canCreate()) {
        this._setFailedTab('salesforce', 'limits');
        return false;
      }

      // Check if user salesforce enabled
      if (!this.user.featureEnabled('salesforce_import')) {

        // Tab not available, so we remove it
        this.enabled_tabs = _.without(this.enabled_tabs, 'salesforce');

        var messagePane = new cdb.admin.ImportMessagePane({
          className:  'import-message-pane salesforce-message-pane',
          template:   this._TABS['salesforce'].template
        });

        return messagePane;
      }

      var salesforcePane = new cdb.admin.ImportUrlPane({
        className:    'import-pane import-salesforce-pane',
        template:     'old_common/views/import/import_salesforce',
        user:         this.user,
        type:         'url',
        service_name: 'salesforce',
        acceptSync:   this.user.get('actions') && this.user.get('actions').sync_tables
      });

      salesforcePane.bind('fileChosen',  this._onValueChosen, this);
      salesforcePane.bind('valueChange', this._onValueChange, this);
      salesforcePane.bind('changeSize',  this._onPaneChangeSize, this);

      return salesforcePane;
    },

    _genMailchimpPane: function() {
      // Config available?
      if (!cdb.config.get('oauth_mailchimp')) {
        this._setFailedTab('mailchimp', 'key');
        return false;
      }

      // Check if user can create or import a new file
      if (!this._canCreate()) {
        this._setFailedTab('mailchimp', 'limits');
        return false;
      }

      if (!this.user.featureEnabled('mailchimp_import')) {
        this.enabled_tabs = _.without(this.enabled_tabs, 'mailchimp');

        return new cdb.admin.ImportMessagePane({
          className:  'import-message-pane mailchimp-message-pane',
          template:   this._TABS['mailchimp'].template
        });
      }

      var mailchimpPane = new cdb.admin.ImportServicePane({
        service:          'mailchimp',
        filename_field:   'filename',
        item_kind:        'list',
        label:             this._TABS['mailchimp'].label,
        show_formats_link: this._TABS['mailchimp'].show_formats_link,
        acceptFileTypes:   this.uploader.acceptFileTypes,
        acceptSync:        this.uploader.acceptSync
      });

      mailchimpPane.bind('fileChosen',  this._onValueChosen,    this);
      mailchimpPane.bind('valueChange', this._onValueChange,    this);
      mailchimpPane.bind('showUpgrade', this._onShowUpgrade,    this);
      mailchimpPane.bind('changeSize',  this._onPaneChangeSize, this);

      return mailchimpPane;
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
        enabled_tabs: this.enabled_tabs,
        tabs:         this.create_tabs,
        panes:        this.create_panes,
        model:        this.model,
        states:       this.options.states,
        $dialog:      this.$dialog
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
      var self = this;
      var $tab = this.create_tabs.getTab(tab);

      // Tipsy?
      var tooltip = new cdb.common.TipsyTooltip({
        el: $tab,
        title: function() {
          return _.template(self._TEXTS.limits[type])({ name: self._TABS[tab].title })
        }
      })
      this.addView(tooltip);
    },

    _setBinds: function() {
      this.create_panes.bind('tabEnabled',  this._onTabChange, this);
      this.model.bind('change:state',       this._onStateChange, this);
      this.model.bind('change:navigation',  this._onNavigationChange, this);
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
        var navigation = this._TABS[tabName] && this._TABS[tabName].type ? this._TABS[tabName].type : 'popular';

        this.model.set({
          navigation: navigation,
          option: tabName,
          upload: upload
        });
      }
    },

    _onNavTabClick: function(e) {
      if (e) this.killEvent(e);
      var self = this;
      var navigation = $(e.target).attr('href') && $(e.target).attr('href').replace('#/', '');

      // Get first item of this navigation type
      var options = [];
      _.each(this.tabs, function(tab) {
        if (!self._TABS[tab].type && navigation === "popular") {
          options.push(tab)
        } else if (navigation === self._TABS[tab].type) {
          options.push(tab)
        }
      });

      if (options.length > 0) {
        this.create_panes.active(options[0]);
      }
    },

    _onNavigationChange: function() {
      var type = this.model.get('navigation');
      var $nav = this.$('.create-tabs-navigation');
      var $list = this.$('.create-tabs');
      var $link = $nav.find('a.' + type);
      // It is necessary to calculate the offset of the list movement
      // A good way is get the default width of the tabs list
      // but at the beginning those lists are not visible and
      // width is always 0 :(.
      // But create-dialog width is available, so here we go!
      var offset = this.$dialog.find('.create-dialog').css('width');

      // Move list
      $list.animate({
        marginLeft: ( type === "other" ? ('-' + offset) : 0 ),
      }, { queue:false, duration:200 });

      // Set proper selected class
      $nav.find('a').removeClass('selected');
      $link.addClass('selected');
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
      if (
        // Check table quota
        ( this.user.get('table_quota') === null || this.user.get('remaining_table_quota') > 0 )
        &&
        // Check bytes quota
        ( this.user.get('quota_in_bytes') === null || this.user.get('remaining_byte_quota') > 0 )
      ) {
        return true
      }

      return false;
    },

    clean: function() {
      this._destroyBinds();
      cdb.core.View.prototype.clean.call(this);
    }

  });
