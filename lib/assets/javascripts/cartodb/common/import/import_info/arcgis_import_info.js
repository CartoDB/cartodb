  
  /**
   *  ArcGIS import info view
   *  
   *  - It will only show sync module if it is a valid url and is a layer
   *
   *  new cdb.admin.DropboxImportInfo({ model: new cdb.admin.ImportPaneModel() })
   *
   */

  cdb.admin.ArcGISImportInfo = cdb.admin.ImportInfo.extend({

    _TEXTS: {
      help: _t('Only an ArcGIS layer can be synchronized')
    },

    _initPanes: function() {
      // Sync pane
      this.syncPane = new cdb.admin.ImportInfo.Sync();
      this.syncPane.bind('periodChange', this._updatePeriod, this);

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
      this.panes.addTab('error',          this.errorPane);
      this.panes.addTab('help',           this.syncHelp);
      

      this.panes.bind('tabEnabled',   this._showTab, this);
      this.panes.bind('tabDisabled',  this._hideTab, this);
      
      this.addView(this.panes);
      this.$el.append(this.panes.render());
    },

    _canSync: function(url) {
      return url.search(/([0-9]+\/|[0-9]+)/) !== -1
    },

    _onChangeValue: function() {
      var val = this.model.get('value');
      var pane = this.panes.activePane;

      if (!val || !cdb.Utils.isURL(val)) {
        this._hideTab();
      } else if (this.options.acceptSync !== undefined) {

        // If it is not public, show help
        if (!this._canSync(val)) {
          this.activeTab('help');
          return false;
        }

        // If it is public and user can sync tables
        if (this._canSync(val)) {
          this.activeTab('sync');
          return false;
        }

        this._hideTab();

      } else {
        this._hideTab();
      }
    }
  });