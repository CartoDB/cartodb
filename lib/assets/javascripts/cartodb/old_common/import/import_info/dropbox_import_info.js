  
  /**
   *  Dropbox import info view
   *  
   *  - It will only show sync module if dropbox file
   *    comes from public folder.
   *
   *  new cdb.admin.DropboxImportInfo({ model: new cdb.admin.ImportPaneModel() })
   *
   */

  cdb.admin.DropboxImportInfo = cdb.admin.ImportInfo.extend({

    _TEXTS: {
      help:     _t('Only files in your Public folder can be synced automatically.'),
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

      // Sync help pane
      this.syncHelp = new cdb.admin.ImportInfo.Message({
        className:  'info sync-help',
        msg:        this._TEXTS.help
      });

      // Error pane
      this.errorPane = new cdb.admin.ImportInfo.Message({
        className: 'info error'
      });

      // Create TabPane
      this.panes = new cdb.ui.common.TabPane({
        el: this.$el
      });

      this.panes.addTab('sync',           this.syncPane);
      this.panes.addTab('sync_disabled',  this.syncDisabledPane);
      this.panes.addTab('error',          this.errorPane);
      this.panes.addTab('help',           this.syncHelp);
      

      this.panes.bind('tabEnabled',   this._showTab, this);
      this.panes.bind('tabDisabled',  this._hideTab, this);
      
      this.addView(this.panes);
      this.$el.append(this.panes.render());
    },

    _isPublicFile: function(url) {
      return url.search('/Public/') != -1
    },

    _onChangeValue: function() {
      var val = this.model.get('value');
      var pane = this.panes.activePane;

      if (!val) {
        this._hideTab();
      } else if (this.options.acceptSync !== undefined) {

        // If it is not public, show help
        if (!this._isPublicFile(val)) {
          this.activeTab('help');
          return false;
        }

        // If it is public but user can sync tables
        if (!this.options.acceptSync && this._isPublicFile(val)) {
          this.activeTab('sync_disabled');
          return false;
        }

        // If it is public and user can sync tables
        if (this.options.acceptSync && this._isPublicFile(val)) {
          this.activeTab('sync');
          return false;
        }

        this._hideTab();

      } else {
        this._hideTab();
      }
    }

  });