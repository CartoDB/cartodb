
  /**
   *  Pane for import a ArcGIS files
   *
   *  - It needs a user model.
   *
   *  new cdb.admin.ImportArcGISPane({
   *    user: user_model
   *  })
   */

  cdb.admin.ImportArcGISPane = cdb.admin.ImportUrlPane.extend({
    
    className: "import-pane import-arcgis-pane",

    _initViews: function() {
      // It will show errors, sync, user,... etc
      this.import_info = new cdb.admin.ArcGISImportInfo({
        el:         this.$('div.infobox'),
        model:      this.model,
        acceptSync: this.options.acceptSync || this.user.get('actions').sync_tables
      });
      
      this.addView(this.import_info);
    }

  });