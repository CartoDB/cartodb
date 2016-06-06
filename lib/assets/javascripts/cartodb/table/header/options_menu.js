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
    'click .export_map':      '_exportMap',
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

    var viewModel = new cdb.editor.ChangeLockViewModel({
      items: [this.model],
      contentType: this.model.isVisualization() ? 'maps' : 'datasets'
    });

    var type = this.model.isVisualization() ? 'maps' : 'datasets';
    viewModel.bind('change:state', function() {
      if (viewModel.get('state') === 'ProcessItemsDone') {
        window.location.href = cdb.config.prefixUrl() + '/dashboard/' + type;
      }
    });

    var view = new cdb.editor.ChangeLockView({
      model: viewModel,
      clean_on_hide: true,
      enter_to_confirm: true
    });

    view.appendToBody();
  },

  /**
   *  Export a map
   */
  _exportMap: function(e) {
    e.preventDefault();

    var view = new cdb.editor.ExportMapView({
      model: new cdb.admin.ExportMapModel({ 'visualization_id': vis_data['id'] }),
      clean_on_hide: true,
      enter_to_confirm: true
    });

    view.appendToBody();
  },

  /**
   *  Export a table
   */
  _exportTable: function(e){
    e.preventDefault();

    // If a sql is applied but it is not valid, don't let the user export it
    if (this.table.isInSQLView() && this.dataLayer && !this.dataLayer.get('query')) return false;

    var view = new cdb.editor.ExportView({
      model: this.dataLayer.table,
      config: config,
      user_data: this.user.toJSON()
    });
    view.appendToBody();
  },

  /**
   *  Duplicate dataset
   */
  _duplicateDataset: function(e){
    e.preventDefault();

    var dialog = new cdb.editor.DuplicateDatasetView({
      model: this.table,
      user: this.user,
      clean_on_hide: true
    });
    dialog.appendToBody();
  },

  /**
   *  Duplicate a visualization
   */
  _duplicateVis: function(e) {
    e.preventDefault();

    var dialog = new cdb.editor.DuplicateVisView({
      model: this.model, //vis
      table: this.table,
      user: this.user,
      clean_on_hide: true
    });
    dialog.appendToBody();
  },

  _changePrivacy: function(e) {
    e.preventDefault();

    var view = new cdb.editor.ChangePrivacyView({
      vis: this.model, //vis
      user: this.options.user,
      enter_to_confirm: true,
      clean_on_hide: true
    });
    view.appendToBody();
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
      var dialog = new cdb.editor.SyncView({
        table: this.table
      });
      dialog.appendToBody();
    }
  },

  /**
   *  Merge tables option
   */
  _mergeTables: function(e) {
    e.preventDefault();

    if (!this.model.isVisualization()) {
      var mergeDialog = new cdb.editor.MergeDatasetsView({
        table: this.table,
        user: this.user
      });
      mergeDialog.appendToBody();
    }
  },

  /**
   *  Georeference table data
   */
  _georeference: function(e) {
    e.preventDefault();
    var dlg;
    var bkgPollingModel = this.options.backgroundPollingModel;
    var tableIsReadOnly = this.table.isSync() || this.table.isInSQLView();
    var canAddGeocoding = bkgPollingModel !== "" ? bkgPollingModel.canAddGeocoding() : true; // With new modals

    if (!this.options.geocoder.isGeocoding() && !tableIsReadOnly && canAddGeocoding) {
      var dlg = new cdb.editor.GeoreferenceView({
        table:  this.table,
        user:   this.user,
        tabs:   ['lonlat', 'city', 'admin', 'postal', 'ip', 'address'],
        option: 'lonlat'
      });
    } else if (this.options.geocoder.isGeocoding() || ( !canAddGeocoding && !tableIsReadOnly )) {
      dlg = cdb.editor.ViewFactory.createDialogByTemplate('common/background_polling/views/geocodings/geocoding_in_progress');
    } else {
      // If table can't geocode == is synched, return!
      return;
    }

    dlg.appendToBody();
  },

  _deleteItem: function(e) {
    this.killEvent(e);
    var isVis = this.model.isVisualization();

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
  }
});
