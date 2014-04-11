  
  /**
   *  Service import info view
   *  
   *  - It will show service help messages + sync tips.
   *
   *  new cdb.admin.ServiceImportInfo({ model: new cdb.admin.ImportPaneModel() })
   *
   */

  cdb.admin.ServiceImportInfo = cdb.admin.ImportInfo.extend({

    _TEXTS: {
      token:    _t('Checking if you\'ve already logged with this service...'),
      oauth:    _t('Instructions to connect your account should appear in a popup. If you can\'t see it, \
                    check your pop-up blocker configuration.'),
      error:    _t('There was an error trying to get your service token or you didn\'t \
                    finish the oAuth process. Try again please.'),
      list:     _t('A list of your files will be displayed in a moment.'),
      upgrade:  _t('To mantain your data in sync with the source <a href="#/showUpgrade">upgrade your plan</a>.')
    },

    _initPanes: function() {
      // Sync pane
      this.syncPane = new cdb.admin.ImportInfo.Sync();
      this.syncPane.bind('periodChange', this._updatePeriod, this);

      // Sync disabled pane
      this.syncDisabledPane = new cdb.admin.ImportInfo.Message({
        className:  'info no-sync',
        msg:        this._TEXTS.upgrade
      });
      this.syncDisabledPane.bind('showUpgrade', this._triggerUpgrade, this);

      // Token info pane
      this.tokenHelp = new cdb.admin.ImportInfo.Message({
        className:  'info tips token',
        msg:        this._TEXTS.token
      });

      // oAuth info pane
      this.oauthHelp = new cdb.admin.ImportInfo.Message({
        className:  'info tips oauth',
        msg:        this._TEXTS.oauth
      });

      // List retrieving
      this.listHelp = new cdb.admin.ImportInfo.Message({
        className:  'info tips list',
        msg:        this._TEXTS.list
      });

      // Error pane
      this.errorPane = new cdb.admin.ImportInfo.Message({
        className:  'info error',
        msg:        this._TEXTS.error
      });

      // Create TabPane
      this.panes = new cdb.ui.common.TabPane({
        el: this.$el
      });

      this.panes.addTab('sync',           this.syncPane);
      this.panes.addTab('sync_disabled',  this.syncDisabledPane);
      this.panes.addTab('oauth',          this.oauthHelp);
      this.panes.addTab('token',          this.tokenHelp);
      this.panes.addTab('list',           this.listHelp);
      this.panes.addTab('error',          this.errorPane);

      this.panes.bind('tabEnabled',   this._showTab, this);
      this.panes.bind('tabDisabled',  this._hideTab, this);
      
      this.addView(this.panes);
      this.$el.append(this.panes.render());
    },

    _onChangeValue: function() {

      var val = this.model.get('value');
      var pane = this.panes.activePane;

      if (!val) {
        this._hideTab();
      } else if (this.options.acceptSync !== undefined) {

        // If user can't sync tables
        if (!this.options.acceptSync) {
          this.activeTab('sync_disabled');
          return false;
        }

        // If user can sync tables
        if (this.options.acceptSync) {
          this.activeTab('sync');
          return false;
        }

        this._hideTab();

      } else {
        this._hideTab();
      }
    }

  });