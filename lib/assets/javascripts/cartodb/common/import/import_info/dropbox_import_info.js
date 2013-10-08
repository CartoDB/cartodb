  
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

    _isPublicFile: function(url) {
      return url.search('/Public/') != -1
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