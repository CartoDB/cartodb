const Backbone = require('backbone');
const _ = require('underscore');
const ImportsModel = require('builder/data/background-importer/imports-model');
const UploadModel = require('dashboard/data/upload-model');
const PermissionModel = require('dashboard/data/permission-model');
const VisualizationModel = require('dashboard/data/visualization-model');
const VisualizationsCollection = require('dashboard/data/visualizations-collection');
const VisFetchModel = require('builder/data/visualizations-fetch-model');
const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const TablesCollection = require('builder/data/visualizations-collection');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const IMPORT = 'import';
const DATASETS = 'datasets';
const SCRATCH = 'scratch';

const IMPORT_TWITTER = 'listing.import.twitter';

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'backgroundPollingView'
];

/**
 *  This model will be on charge of create a new map
 *  using user selected datasets, where they can be
 *  already imported datasets or remote (and needed to import)
 *  datasets.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    type: 'map',
    contentPane: 'listing', // [listing, loading]
    option: 'listing',
    currentImport: null,
    tableIdsArray: [],
    listing: 'datasets', // [import, datasets, scratch]
    collectionFetched: false,
    activeImportPane: 'file',
    navigationVisible: true
  },

  _DEFAULT_MAP_NAME: 'Untitled Map',

  initialize: function (attributes, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.upload = new UploadModel(
      { create_vis: true },
      { userModel: this._userModel, configModel: this._configModel }
    );

    this.selectedDatasets = new TablesCollection(options.selectedItems, { configModel: this._configModel });
    this.collection = new VisualizationsCollection(null, { configModel: this._configModel });
    this.vis = new VisualizationModel({ name: 'Untitled map' }, { configModel: this._configModel });
    this.visFetchModel = new VisFetchModel({
      content_type: 'datasets',
      library: this.showLibrary()
    });

    this._initBinds();
  },

  setSelected: function (datasets) {
    this.selectedDatasets.reset(datasets);
  },

  // For entry point, notifies model that depending views are ready for changes (required for custom events)
  viewsReady: function () {
    if (this.selectedDatasets.isEmpty()) {
      this._maybePrefetchDatasets();
    } else {
      // Not empty, so start creating map from these preselected items
      this.createMap();
    }
  },

  // For create-listing view
  showLibrary: function () {
    return false;
  },

  // For create-listing view
  showDatasets: function () {
    return true;
  },

  // For create-listing view
  canSelect: function (datasetModel) {
    if (datasetModel.get('selected')) {
      return true;
    } else {
      return this.selectedDatasets.length < this._userModel.getMaxLayers();
    }
  },

  canFinish: function () {
    if (this.get('listing') === 'import') {
      return this.upload.isValidToUpload();
    } else if (this.get('listing') === 'datasets') {
      return this.selectedDatasets.length > 0;
    }
  },

  finish: function () {},

  // Get option state (it could be listing or loading)
  getOption: function () {
    var option = this.get('option');
    var states = option.split('.');

    if (states.length > 0) {
      return states[0];
    }

    return '';
  },

  // Get import state (it could be any of the possibilities of the import options, as in scratch, dropbox, etc...)
  // For create-footer view
  getImportState: function () {
    var option = this.get('option');
    var states = option.split('.');

    if (states.length > 0 && states.length < 4 && states[0] === 'listing' && states[1] === 'import') {
      return states[2];
    }

    return '';
  },

  // For create-footer view
  showGuessingToggler: function () {
    return true;
  },

  // For create-footer view
  showPrivacyToggler: function () {
    var hiddenDueToDeprecation = this._atTwitterImportPane() && !this._userModel.hasOwnTwitterCredentials();
    var hasToBeShowed = this._atImportPane() && !hiddenDueToDeprecation;
    return hasToBeShowed;
  },

  // For create-listing-import view
  setActiveImportPane: function (option) {
    if (option && this._atImportPane() && this.getImportState() !== option) {
      this.set('option', 'listing.import.' + option);
    }
  },

  // For create-footer view
  isMapType: function () {
    return true;
  },

  // For create-footer view
  startUpload: function () {
    this._backgroundPollingView._addDataset(this.upload.toJSON());
  },

  createMap: function () {
    if (this.selectedDatasets.length === 0) {
      return;
    }
    this.set('contentPane', 'loading');
    this._checkCollection();
  },

  // For create-from-scratch view
  createFromScratch: function (configModel) {
    this.trigger('creatingDataset', 'dataset', this);
    this.set('contentPane', 'loading');

    var dataset = new CartoTableMetadata(null, { configModel: this._configModel });

    dataset.save({}, {
      success: m => {
        this.trigger('datasetCreated', m, this);
      },
      error: (m, e) => {
        this.trigger('datasetError', e, this);
      }
    });
  },

  _initBinds: function () {
    this.upload.bind('change', function () {
      this.trigger('change:upload', this);
    }, this);

    this.bind('change:option', this._onOptionChange, this);

    this.collection.bind('change:selected', function (changedModel, wasSelected) {
      this.selectedDatasets[ wasSelected ? 'add' : 'remove' ](changedModel);
    }, this);

    this.collection.bind('reset', function () {
      this.selectedDatasets.each(function (model) {
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
      this.bind('change:navigationVisible', this._toggleNavigation, this);
    }
  },

  _maybePrefetchDatasets: function () {
    var isDatasets = this.get('listing') === 'datasets';

    // Fetch collection if it was never fetched (and a search is not applied!)
    if (isDatasets && !this.get('collectionFetched') && !this.visFetchModel.isSearching()) {
      this._fetchCollection();
    }
  },

  _toggleNavigation: function () {
    this.get('navigationVisible')
      ? this.trigger('toggleNavigation', true, this)
      : this.trigger('toggleNavigation', false, this);
  },

  _fetchCollection: function () {
    this.set('collectionFetching', true);
    var params = this.visFetchModel.attributes;
    var types;

    if (this.visFetchModel.isSearching()) {
      // Supporting search in data library and user datasets at the same time
      types = 'table,remote';
    } else {
      types = params.library ? 'remote' : 'table';
    }

    this.collection.options.set({
      locked: '',
      q: params.q,
      page: params.page || 1,
      tags: params.tag,
      per_page: this.collection['_TABLES_PER_PAGE'],
      shared: params.shared,
      only_liked: params.liked,
      order: 'updated_at',
      type: '',
      types: types,
      exclude_raster: true
    });

    this.collection.fetch({
      success: function () {
        this.set({
          collectionFetching: false,
          collectionFetched: true
        });
      }.bind(this)
    });
  },

  getVisualizationFetchModel: function () {
    return this.visFetchModel;
  },

  getTablesCollection: function () {
    return this.collection;
  },

  getSelectedDatasetsCollection: function () {
    return this.selectedDatasets;
  },

  getUploadModel: function () {
    return this.upload;
  },

  _selectedItems: function () {
    return this.selectedDatasets;
  },

  _checkCollection: function () {
    if (this.selectedDatasets.length > 0) {
      this._importDataset(this.selectedDatasets.pop());
    } else {
      this.set('currentImport', '');
      this._createMap();
    }
  },

  _importDataset: function (mdl) {
    var tableIdsArray = _.clone(this.get('tableIdsArray'));

    if (mdl.get('type') === 'remote') {
      var d = {
        create_vis: false,
        type: 'remote',
        value: mdl.get('name'),
        remote_visualization_id: mdl.get('id'),
        size: mdl.get('external_source') ? mdl.get('external_source').size : undefined
      };

      var impModel = new ImportsModel({}, {
        upload: d,
        userModel: this._userModel,
        configModel: this._configModel
      });
      this.set('currentImport', _.clone(impModel));
      this.trigger('importingRemote', this);

      impModel.bind('change:state', function (m) {
        if (m.hasCompleted()) {
          var data = m.getImportModel().toJSON();
          tableIdsArray.push(data.table_name);
          this.set('tableIdsArray', tableIdsArray);
          this._checkCollection();
          this.trigger('importCompleted', this);
        }
        if (m.hasFailed()) {
          this.set('contentPane', 'importFailed');
          this.trigger('importFailed', this);
        }
      }, this);

      // If import model has any errors at the beginning
      if (impModel.hasFailed()) {
        this.set('contentPane', 'importFailed');
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

  _createMap: function () {
    const vis = new VisualizationModel({
      name: this._DEFAULT_MAP_NAME,
      type: 'derived'
    }, { configModel: this._configModel });

    vis.permission = new PermissionModel({
      owner: this._userModel.attributes
    }, {
      configModel: this._configModel,
      userModel: this._userModel
    });

    this.trigger('creatingMap', this);

    vis.save({
      tables: this.get('tableIdsArray')
    }, {
      success: () => {
        this._redirectTo(vis.viewUrl(this._userModel).edit().toString());
      },
      error: () => {
        this.trigger('mapError', this);
      }
    });
  },

  _atImportPane: function () {
    return this.get('listing') === IMPORT;
  },

  _atDatasetsPane: function () {
    return this.get('listing') === DATASETS;
  },

  _atScratchPane: function () {
    return this.get('listing') === SCRATCH;
  },

  _atTwitterImportPane: function () {
    return this.get('option') === IMPORT_TWITTER;
  },

  _redirectTo: function (url) {
    window.location = url;
  }

});
