  
  /**
   *  GDrive import info view
   *  
   *  - For the moment GDrive files are always syncable.
   *
   *  new cdb.admin.GDriveImportInfo({ model: new cdb.admin.ImportPaneModel() })
   *
   */

  cdb.admin.GDriveImportInfo = cdb.admin.ImportInfo.extend({

    _isPublicFile: function(url) {
      return true
    },

    _onChangeValue: function() {
      var val = this.model.get('value');
      var pane = this.panes.activePane;

      if (!val) {
        this._hideTab();
      } else if (this._isPublicFile(val) && this.options.acceptSync !== undefined) {
        
        // If dropbox file is public, it should let
        // user sync the table        
        if (this.options.acceptSync) {
          this.activeTab('sync')
        } else {
          this.activeTab('sync_disabled')
        }
        
      } else {
        this._hideTab();
      }
    }

  });