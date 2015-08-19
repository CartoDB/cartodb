var cdb = require('cartodb.js');
var _ = require('underscore');
var ImportsModel = require('../../background_polling/models/imports_model');
var UploadModel = require('../../background_polling/models/upload_model');
var VisFetchModel = require('../../visualizations_fetch_model');
var LocalStorage = require('../../local_storage');
var CreateOnboarding = require('./create_onboarding');

/**
 *  This model will be on charge of create a new map
 *  using user selected datasets, where they can be
 *  already imported datasets or remote (and needed to import)
 *  datasets.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'map',
    option: 'listing',
    currentImport: null,
    tableIdsArray: [],
    listing: 'datasets' // [import, datasets, scratch]
  },

  _DEFAULT_MAP_NAME: 'Untitled Map',

  initialize: function(attrs, opts) {
    this.user = opts.user;
    this.upload = new UploadModel({
      create_vis: true
    }, {
      user: this.user
    });

    this.selectedDatasets = new Backbone.Collection(opts.selectedItems);
    this.collection = new cdb.admin.Visualizations();
    this.vis = new cdb.admin.Visualization({ name: 'Untitled map' });
    this.visFetchModel = new VisFetchModel({
      content_type: 'datasets',
      library: this.showLibrary()
    });
    this.localStorage = new LocalStorage();

    this._initBinds();
  },

  // For entry point, notifies model that depending views are ready for changes (required for custom events)
  viewsReady: function() {
    if (this.selectedDatasets.isEmpty()) {
      this._maybePrefetchDatasets();
    } else {
      // Not empty, so start creating map from these preselected items
      this.createMap();
    }
  },

  // For create-content
  createOnboardingView: function() {
    if (this.showOnboarding()) {
      return new CreateOnboarding({
        localStorage: this.localStorage,
        model: this
      });
    }
  },

  showOnboarding: function() {
    return !this.localStorage.get('onboarding-create-map');
  },

  // For create-listing view
  showLibrary: function() {
    return false;
  },

  // For create-listing view
  showDatasets: function() {
    return true;
  },

  // For create-listing view
  canSelect: function(datasetModel) {
    if (datasetModel.get('selected')) {
      return true;
    } else {
      return this.selectedDatasets.length < this.user.get('max_layers');
    }
  },

  // Get option state (it could be listing or loading)
  getOption: function() {
    var option = this.get('option');
    var states = option.split('.');

    if (states.length > 0) {
      return states[0];
    }

    return '';
  },

  // Get import state (it could be any of the possibilities of the import options, as in scratch, dropbox, etc...)
  // For create-footer view
  getImportState: function() {
    var option = this.get('option');
    var states = option.split('.');

    if (states.length > 0 && states.length < 4 && states[0] === "listing" && states[1] === "import") {
      return states[2];
    }

    return '';
  },

  // For create-footer view
  showGuessingToggler: function() {
    return true;
  },

  // For create-listing-import view
  setActiveImportPane: function(option) {
    if (option && this.get('listing') === "import" && this.getImportState() !== option) {
      this.set('option', 'listing.import.' + option);
    }
  },

  // For create-footer view
  isMapType: function() {
    return true;
  },

  // For create-footer view
  startUpload: function() {
    cdb.god.trigger('importByUploadData', this.upload.toJSON());
  },

  createMap: function() {
    if (this.selectedDatasets.length === 0) {
      return;
    }
    this.set('option', 'loading');
    this._checkCollection();
  },

  // For create-from-scratch view
  createFromScratch: function() {
    this.trigger('creatingDataset', 'dataset', this);
    this.set('option', 'loading');

    var self = this;
    var dataset = new cdb.admin.CartoDBTableMetadata();

    dataset.save({}, {
      success: function(m) {
        self.trigger('datasetCreated', m, self);
      },
      error: function(m, e) {
        self.trigger('datasetError', e, self);
      }
    });
  },

  _initBinds: function() {
    this.upload.bind('change', function() {
      this.trigger('change:upload', this);
    }, this);
    this.bind('change:option', this._onOptionChange, this);

    this.collection.bind('change:selected', function(changedModel, wasSelected) {
      this.selectedDatasets[ wasSelected ? 'add' : 'remove' ](changedModel);
    }, this);
    this.collection.bind('reset', function() {
      this.selectedDatasets.each(function(model) {
        var sameModel = this.collection.get(model.id);
        if (sameModel) {
          sameModel.set('selected', true);
        }
      }, this);
    }, this);
    this.visFetchModel.bind('change', this._fetchCollection, this);

    if (this.selectedDatasets.isEmpty()) {
      this.bind('change:option', this._maybePrefetchDatasets, this);
      this.bind('change:listing', this._maybePrefetchDatasets, this);
    }
  },

  _maybePrefetchDatasets: function() {
    var isDatasets = this.get('listing') === 'datasets';

    // Fetch collection if it was never fetched (and a search is not applied!)
    if (isDatasets && !this.get('collectionFetched') && !this.visFetchModel.isSearching()) {
      this.set('collectionFetched', true);
      this._fetchCollection();
    }
  },

  _fetchCollection: function() {
    var params = this.visFetchModel.attributes;
    var types;

    if (this.visFetchModel.isSearching()) {
      // Supporting search in data library and user datasets at the same time
      types = 'table,remote';
    } else {
      types = params.library ? 'remote' : 'table';
    }

    this.collection.options.set({
      locked:         '',
      q:              params.q,
      page:           params.page || 1,
      tags:           params.tag,
      per_page:       this.collection['_TABLES_PER_PAGE'],
      shared:         params.shared,
      only_liked:     params.liked,
      order:          'updated_at',
      type:           '',
      types:          types
    });

    this.collection.fetch();
  },

  _selectedItems: function() {
    return this.selectedDatasets;
  },

  _checkCollection: function() {
    if (this.selectedDatasets.length > 0) {
      this._importDataset(this.selectedDatasets.pop());
    } else {
      this.set('currentImport', '');
      this._createMap();
    }
  },

  _importDataset: function(mdl) {
    var tableIdsArray = _.clone(this.get('tableIdsArray'));

    if (mdl.get('type') === "remote") {
      var d = {
        create_vis: false,
        type: 'remote',
        value: mdl.get('name'),
        remote_visualization_id: mdl.get('id'),
        size: mdl.get('external_source') ? mdl.get('external_source').size : undefined
      };

      var impModel = new ImportsModel({}, {
        upload: d,
        user: this.user
      });
      this.set('currentImport', _.clone(impModel));
      this.trigger('importingRemote', this);

      impModel.bind('change:state', function(m) {
        if (m.hasCompleted()) {
          var data = m.imp.toJSON();
          tableIdsArray.push(data.table_name);
          this.set('tableIdsArray', tableIdsArray);
          this._checkCollection();
          this.trigger('importCompleted', this);
        }
        if (m.hasFailed()) {
          this.trigger('importFailed', this);
        }
      }, this);

      // If import model has any errors at the beginning
      if (impModel.hasFailed()) {
        this.trigger('importFailed', this);
      }
    } else {
      var table = mdl.tableMetadata();
      tableIdsArray.push(table.get('name'));
      this.set({
        currentImport: '',
        tableIdsArray: tableIdsArray
      });
      this._checkCollection();
    }
  },

  _createMap: function() {
    var self = this;
    var vis = new cdb.admin.Visualization({
      name: this._DEFAULT_MAP_NAME,
      type: 'derived'
    });

    this.trigger('creatingMap', this);

    vis.save({
      tables: this.get('tableIdsArray')
    }, {
      success: function() {
        self._redirectTo(vis.viewUrl().edit().toString());
      },
      error: function() {
        self.trigger('mapError', self);
      }
    });
  },

  _redirectTo: function(url) {
    window.location = url;
  }


});
