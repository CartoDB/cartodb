
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
    'click .lock_vis':        '_lockVis',
    'click .export_table':    '_exportTable',
    'click .duplicate_table': '_duplicateDataset',
    'click .duplicate_vis':   '_duplicateVis',
    'click .append_data':     '_appendData',
    'click .delete_table':    '_deleteItem',
    'click .georeference':    '_georeference',
    'click .merge_tables':    '_mergeTables',
    'click .change_privacy':  '_changePrivacy',
    'click .sync_settings':   '_syncSettings',
    'click .delete_vis':      '_deleteItem'
  },

  render: function() {
    var opts = this.options;
    this.user = this.options.user;
    this.dataLayer = this.options.dataLayer;
    this.table = this.dataLayer.table;

    opts.isVisualization = this.model.isVisualization();
    opts.table = this.table;
    opts.dataLayer = this.options.dataLayer;

    // Get ownership from the visualization or from the table selected
    // depending the type of it (table or derived)
    // opts.isOwner = this[ this.model.isVisualization() ? 'model' : 'table' ].permission.isOwner(this.options.user);
    opts.isLayerOwner = this.table.permission.isOwner(this.user);
    opts.isVisOwner = this.model.permission.isOwner(this.user);

    opts.googleUser = this.user.featureEnabled('google_maps');

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
    var per =  !user.geocoding.quota ? 100 : ( user.geocoding.monthly_use * 100 ) / user.geocoding.quota;
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

  // Lock visualization (type derived or table)
  _lockVis: function(e) {
    if (e) e.preventDefault();

    var self = this;
    var finishedCallback = function() {
      var type = self.model.isVisualization() ? 'maps' : 'datasets';
      window.location.href = cdb.config.prefixUrl() + '/dashboard/' + type;
    };

    if (this.options.user.featureEnabled('new_modals')) {
      var viewModel = new cdb.editor.ChangeLockViewModel({
        items: [this.model],
        contentType: this.model.isVisualization() ? 'maps' : 'datasets'
      });
      viewModel.bind('change:state', function() {
        if (viewModel.get('state') === 'ProcessItemsDone') {
          finishedCallback();
        }
      });

      var view = new cdb.editor.ChangeLockView({
        model: viewModel,
        clean_on_hide: true,
        enter_to_confirm: true
      });

      view.appendToBody();
      return;
    }

    var dlg = new cdb.admin.LockVisualizationDialog({
      model: this.model,
      user: this.user,
      onResponse: finishedCallback
    });

    dlg.appendToBody().open({ center: true });
  },

  /**
   *  Export a table
   */
  _exportTable: function(e){
    e.preventDefault();

    // If a sql is applied but it is not valid, don't let the user export it
    if (this.table.isInSQLView() && this.dataLayer && !this.dataLayer.get('query')) return false;

    var DialogView = this.options.user.featureEnabled('new_modals') ? cdb.editor.ExportView : cdb.admin.ExportTableDialog;
    var export_dialog = new DialogView({
      model: this.dataLayer.table,
      config: config,
      user_data: this.user.toJSON()
    });

    export_dialog
      .appendToBody()
      .open();
  },

  /**
   *  Duplicate dataset
   */
  _duplicateDataset: function(e){
    e.preventDefault();

    if (this.user.featureEnabled('new_modals')) {
      var dialog = new cdb.editor.DuplicateDatasetView({
        model: this.table,
        user: this.user,
        clean_on_hide: true
      });
      return dialog.appendToBody().open();
    }

    if (!this.model.isVisualization()) {
      var duplicate_dialog = new cdb.admin.DuplicateTableDialog({
        model: this.table
      });

      duplicate_dialog
        .appendToBody()
        .open();
    }
  },

  /**
   *  Duplicate a visualization
   */
  _duplicateVis: function(e) {
    e.preventDefault();

    if (this.user.featureEnabled('new_modals')) {
      var dialog = new cdb.editor.DuplicateVisView({
        model: this.model, //vis
        table: this.table,
        user: this.user,
        clean_on_hide: true
      });
      return dialog.appendToBody().open();
    }

    if (this.model.isVisualization()) {
      var duplicate_dialog = new cdb.admin.DuplicateVisDialog({ model: this.model });

      duplicate_dialog
        .appendToBody()
        .open();
    }
  },

  _changePrivacy: function(e) {
    e.preventDefault();

    this.privacy_dialog = new cdb.admin.PrivacyDialog({
      model: this.model,
      config: config,
      user: this.options.user
    });

    $("body").append(this.privacy_dialog.render().el);
    this.privacy_dialog.open({ center:true });

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

      if (this.user.featureEnabled('new_modals')) {
        this._createSyncDialog();
      } else {
        var dlg = new cdb.admin.SyncSettings({
          table: this.table
        });

        dlg
        .appendToBody()
        .open();
      }
    }
  },

  _createSyncDialog: function() {

    var dialog = new cdb.editor.SyncView({
      table: this.table
    });

    dialog.appendToBody()
    .open();

  },

  /**
   *  Delete a table
   */
  _deleteTable: function() {
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
            window.location = cdb.config.prefixUrl() + "/dashboard/tables"
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
      var user = this.user;
      var MergeView = user.featureEnabled('new_modals') ? cdb.editor.MergeDatasetsView : cdb.admin.MergeTablesDialog
      var mergeDialog = new MergeView({
        table: this.table,
        user: user
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

    if (!this.options.geocoder.isGeocoding() && !this.table.isSync() && !this.table.isInSQLView()) {

      dlg = new cdb.admin.GeocodingDialog({
        table:  this.table,
        user:   this.user,
        tabs:   ['lonlat', 'city', 'admin', 'postal', 'ip', 'address'],
        option: 'lonlat'
      });

      dlg.bind('geocodingChosen', this._onGeocodingChosen, this);

    } else if (this.options.geocoder.isGeocoding()) {
      dlg = new cdb.admin.GeocoderWorking();
    } else {
      // If table can't geocode == is synched, return!
      return;
    }

    dlg
      .appendToBody()
      .open({ center: true });
  },

  _sendGeocodingMetrics: function(type) {
    // TODO: remove mixpanel
    cdb.god.trigger('mixpanel', 'Geocoding', {
      type: type,
      table_name: this.table.get('id')
    });

    // Event tracking "Geocoding"
    cdb.god.trigger('metrics', 'geocoding', {
      email: window.user_data.email,
      data: {
        type: type,
        table_name: this.table.get('id')
      }
    });

  },

  _onGeocodingChosen: function(data) {
    this._sendGeocodingMetrics(data.type);

    // Lon-lat type?
    if (data.type == "lonlat") {
      this.table.bind('notice', this.options.globalError.showError, this.options.globalError);
      this.table.geocodeLatAndLng(data.latitude, data.longitude);
      return false;
    }

    // Address, city, region, postal or ip?
    if (data.type !== "lonlat") {
      // Remove unnecesary data in any case and start geocoder
      this.options.geocoder.set(_.omit(data, 'table_name', 'type'));
      return false;
    }

    cdb.log.info('No geocoder option for ' + data.kind, obj);
  },

  /**
   *  Delete a visualization
   */
  _deleteVis: function() {
    if (this.model.isVisualization()) {
      var self = this;
      var dlg = new cdb.admin.DeleteVisualizationDialog({
        model: this.model
      });

      dlg
        .appendToBody()
        .open({ center: true });

      dlg.ok = function() {
        self.model.destroy({
          success: function() {
            window.location.href = cdb.config.prefixUrl() + "/dashboard/visualizations"
          },
          error: function() {
            self.options.globalError.showError(self._TEXTS.error, 'info', 3000);
          }
        });
      }
    }
  },

  _deleteItem: function(e) {
    this.killEvent(e);
    var isVis = this.model.isVisualization();

    // TODO: remove _deleteTable and _deleteVis once we remove new_dashboard feature flag
    if (this.user.featureEnabled('new_modals')) {
      var viewModel = new cdb.editor.DeleteItemsViewModel(this.model, {
        contentType: isVis ? 'maps' : 'datasets'
      });

      viewModel.bind('DeleteItemsDone', function() {
        var dashboard = this.user.viewUrl().dashboard();
        window.location = isVis ? dashboard.maps() : dashboard.datasets();
      }, this);

      var view = new cdb.editor.DeleteItemsView({
        viewModel: viewModel,
        user: this.user,
        clean_on_hide: true,
        enter_to_confirm: true
      });
      view.appendToBody();
    } else {
      isVis ? this._deleteVis() : this._deleteTable();
    }
  }
});
