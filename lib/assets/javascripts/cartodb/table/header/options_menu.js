
/**
 *  Header table view options menu
 *
 *  It needs a visualization model + account config data.
 *
 *  var options_menu = new cdb.admin.HeaderOptionsMenu({
 *    target:         $(a),
 *    model:          vis_model,
 *    user:           user_model,
 *    geocoder:       geocoder,
 *    template_base: 'table/header/views/options_menu'
 *  })
 *
 */


cdb.admin.HeaderOptionsMenu = cdb.admin.DropdownMenu.extend({

  className: 'dropdown table-options',

  _TEXTS: {
    error: _t('Something went wrong, try again later')
  },

  events: {
    'click .export_table':    '_exportTable',
    'click .duplicate_table': '_duplicateTable',
    'click .append_data':     '_appendData',
    'click .delete_table':    '_deleteTable',
    'click .georeference':    '_georeference',
    'click .merge_tables':    '_mergeTables',
    'click .change_privacy':  '_changePrivacy',
    'click .sync_settings':   '_syncSettings',
    'click .duplicate_vis':   '_duplicateVis',
    'click .delete_vis':      '_deleteVis'
  },

  render: function() {
    var opts = this.options;
    this.table = this.model.map.layers && this.model.map.layers.last().table;
    this.user = this.options.user;
    this.dataLayer = this.options.dataLayer;
    opts.isVisualization = this.model.isVisualization();
    opts.table = this.table;
    opts.dataLayer = this.options.dataLayer;

    this.$el
      .html(this.template_base(opts))
      .css({
        width: this.options.width
      });

    this._setGeocodingBar();

    return this;
  },

  show: function() {
    this.render();
    this.constructor.__super__.show.apply(this);
  },

  _setGeocodingBar: function() {
    var user = this.user.toJSON();
    user.geocoding = user.geocoding || {};
    var per =  ( user.geocoding.monthly_use * 100 ) / user.geocoding.quota;
    var per_class = "";

    if (per < 90 & per > 79 ) {
      per_class = "caution";
    } else if (per > 89) {
      per_class = "danger";
    }

    this.$('.progress-bar')
      .find('.bar-2')
      .width(per + "%")
      .removeClass('danger caution')
      .addClass(per_class);
  },

  /**
   *  Export a table
   */
  _exportTable: function(e){
    e.preventDefault();

    if (!this.model.isVisualization()) {

      // If a sql is applied but it is not valid, don't let user export it
      if (this.table.isInSQLView() && this.dataLayer && !this.dataLayer.get('query')) return false;

      var export_dialog = new cdb.admin.ExportTableDialog({
        model: this.table,
        config: config,
        user_data: this.user.toJSON()
      });

      export_dialog
        .appendToBody()
        .open();
    }
  },

  /**
   *  Duplicate table
   */
  _duplicateTable: function(e){
    e.preventDefault();

    if (!this.model.isVisualization()) {
      var duplicate_dialog = new cdb.admin.DuplicateTableDialog({
        model: this.table
      });

      duplicate_dialog
        .appendToBody()
        .open();
    }
  },

  _changePrivacy: function(e) {
    e.preventDefault();

    this.privacy_dialog = new cdb.admin.PrivacyDialog({
      model: this.model,
      title: "Change privacy",
      config: this.options.config,
      user: this.options.user
    });

    $("body").append(this.privacy_dialog.render().el);
    this.privacy_dialog.open();

  },


  /**
   *  Append data to a table (disabled for the moment :( )
   */
  _appendData: function(e){
    e.preventDefault();
  },

  /**
   *  Sync table settings
   */
  _syncSettings: function(e) {
    e.preventDefault();

    if (!this.model.isVisualization()) {
      var dlg = new cdb.admin.SyncSettings({
        table: this.table
      });

      dlg
        .appendToBody()
        .open();
    }
  },

  /**
   *  Delete a table
   */
  _deleteTable: function(e){
    e.preventDefault();

    if (!this.model.isVisualization()) {
      this.delete_dialog = new cdb.admin.DeleteDialog({
        model: this.table,
        config: config,
        user: this.user
      });
      $("body").append(this.delete_dialog.render().el);
      this.delete_dialog.open();

      var self = this;
      this.delete_dialog.ok = function() {
        self.model.destroy({
          success: function() {
            window.location.href = "/dashboard/"
          }
        });
      };
    }
  },

  /**
   *  Merge tables option
   */
  _mergeTables: function(e) {
    e.preventDefault();

    if (!this.model.isVisualization()) {
      var mergeDialog = new cdb.admin.MergeTablesDialog({
        table: this.table
      });

      mergeDialog
        .appendToBody()
        .open({ center:true });
    }
  },

  /**
   *  Georeference table data
   */
  _georeference: function(e) {
    e.preventDefault();

    if (!this.model.isVisualization()) {
      var dlg;
      if (!this.options.geocoder.isGeocoding() && !this.table.isSync()) {
        dlg = new cdb.admin.GeoreferenceDialog({
          table: this.table,
          user: this.user,
          geocoder: this.options.geocoder
        });
      } else if (this.options.geocoder.isGeocoding()) {
        dlg = new cdb.admin.GeocoderWorking();
      } else {
        // If table can't geocode == is synched, return!
        return;
      }

      dlg
        .appendToBody()
        .open({ center: true });

        window.georeference = dlg; // TODO: REMOVE THIS

    }
  },

  /**
   *  Duplicate a visualization
   */
  _duplicateVis: function(e) {
    e.preventDefault();

    if (this.model.isVisualization()) {
      var duplicate_dialog = new cdb.admin.DuplicateVisDialog({ model: this.model });

      duplicate_dialog
        .appendToBody()
        .open();
    }
  },

  /**
   *  Delete a visualization
   */
  _deleteVis: function(e) {
    e.preventDefault();

    if (this.model.isVisualization()) {
      var self = this;
      var dlg = new cdb.admin.DeleteVisualizationDialog();

      dlg
        .appendToBody()
        .open();

      dlg.ok = function() {
        self.model.destroy({
          success: function() {
            window.location.href = "/dashboard/"
          },
          error: function() {
            self.options.globalError.showError(self._TEXTS.error, 'info', 3000);
          }
        });
      }
    }
  }
});
