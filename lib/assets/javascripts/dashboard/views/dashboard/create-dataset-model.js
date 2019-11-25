const Backbone = require('backbone');
const UploadModel = require('dashboard/data/upload-model');
const VisFetchModel = require('builder/data/visualizations-fetch-model');
const VisualizationsCollection = require('dashboard/data/visualizations-collection');
const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');

const UPLOAD = 'upload';
const IMPORT = 'import';
const DATASETS = 'datasets';
const SCRATCH = 'scratch';

const IMPORT_TWITTER = 'listing.import.twitter';

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'backgroundPollingView'
];

/**
 *  Create dataset model
 *
 *  - Store the state of the dialog (listing or loading).
 *  - Store the selected datasets for a map creation.
 *  - Store the upload info for a dataset creation.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    type: 'dataset',
    contentPane: 'listing',
    option: 'listing',
    listing: 'datasets', // [upload, import, datasets, scratch]
    navigationVisible: true
  },

  initialize: function (attributes, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.upload = new UploadModel(
      { create_vis: false },
      { userModel: this._userModel,
        configModel: this._configModel }
    );

    this.selectedDatasets = new Backbone.Collection();
    this.collection = new VisualizationsCollection(null, { configModel: this._configModel });
    this.visFetchModel = new VisFetchModel({
      content_type: 'datasets',
      library: this.showLibrary()
    });

    this._initBinds();
  },

  viewsReady: function () {
    // nothing to do for this use-case
    this.set('listing', 'import');
  },

  // For create-listing view
  showLibrary: function () {
    return true;
  },

  // For create-listing view
  showDatasets: function () {
    return false;
  },

  // For create-listing view
  canSelect: function () {
    return true;
  },

  // Get option state (it could be loading or listing)
  getOption: function () {
    const option = this.get('option');
    const states = option.split('.');

    if (states.length > 0) {
      return states[0];
    }

    return '';
  },

  // Get import state (it could be any of the possibilities of the import options, as in scratch, dropbox, etc...)
  // For create-footer view
  getImportState: function () {
    const option = this.get('option');
    const states = option.split('.');

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
    const hiddenDueToDeprecation = this._atTwitterImportPane() && !this._userModel.hasOwnTwitterCredentials();
    const hasToBeShowed = this._atAnyImportPane() && !hiddenDueToDeprecation;
    return hasToBeShowed;
  },

  // Both panes import data
  _atAnyImportPane: function () {
    return this._atImportPane() || this._atUploadPane();
  },

  _atUploadPane: function () {
    return this.get('listing') === UPLOAD;
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

  // For create-footer view
  startUpload: function () {
    this._backgroundPollingView._addDataset(this.upload.toJSON());
  },

  // For create-listing-import view
  setActiveImportPane: function (option) {
    if (option && this._atImportPane() && this.getImportState() !== option) {
      this.set('option', 'listing.import.' + option);
    }
  },

  // For create-footer view
  isMapType: function () {
    return false;
  },

  // For create-from-scratch view
  createFromScratch: function () {
    this.trigger('creatingDataset', 'dataset', this);
    this.set('contentPane', 'creatingFromScratch');

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
    this.listenTo(this.upload, 'change', function () {
      this.trigger('change:upload', this);
    });

    this.listenTo(this.collection, 'change:selected', this._onItemSelected);
    this.listenTo(this.visFetchModel, 'change', this._fetchCollection);

    this.listenTo(this, 'change:option', this._maybePrefetchDatasets, this);
    this.listenTo(this, 'change:listing', this._maybePrefetchDatasets, this);
    this.listenTo(this, 'change:navigationVisible', this._toggleNavigation, this);
  },

  _maybePrefetchDatasets: function () {
    const isDatasets = this.get('listing') === 'datasets';

    // Fetch collection if it was never fetched (and a search is not applied!)
    if (isDatasets && !this.get('collectionFetched') && !this.visFetchModel.isSearching()) {
      this.set('collectionFetched', true);
      this._fetchCollection();
    }
  },

  _toggleNavigation: function () {
    this.get('navigationVisible')
      ? this.trigger('toggleNavigation', true, this)
      : this.trigger('toggleNavigation', false, this);
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

  canFinish: function () {},

  finish: function () {},

  _selectedItems: function () {
    return this.collection.where({ selected: true });
  },

  _fetchCollection: function () {
    const params = this.visFetchModel.attributes;

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
      types: params.library ? 'remote' : 'table',
      exclude_raster: true
    });

    this.collection.fetch();
  },

  _onItemSelected: function (changedModel) {
    // Triggers an import immediately
    if (changedModel.get('type') === 'remote') {
      // previously located in listings/datasets/remote_datasets_item_view
      const table = new CartoTableMetadata(changedModel.get('external_source'), { configModel: this._configModel });
      const data = {
        type: 'remote',
        value: changedModel.get('name'),
        remote_visualization_id: changedModel.get('id'),
        size: table.get('size'),
        create_vis: false
      };

      this._backgroundPollingView._addDataset(data);
      this.trigger('destroyModal');
    }
  }

});
