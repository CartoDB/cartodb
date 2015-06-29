var cdb = require('cartodb.js');
var UploadModel = require('../../background_polling/models/upload_model');
var VisFetchModel = require('../../visualizations_fetch_model');
var LocalStorage = require('../../local_storage');
var CreateOnboarding = require('./create_onboarding');

/**
 *  Create dataset model
 *
 *  - Store the state of the dialog (templates, listing, preview).
 *  - Store the selected datasets for a map creation.
 *  - Store the upload info for a dataset creation.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'dataset',
    option: 'listing',
    listing: 'import' // [import, datasets, scratch]
  },

  initialize: function(val, opts) {
    this.user = opts.user;
    this.upload = new UploadModel({
      create_vis: false
    }, {
      user: this.user
    });

    this.selectedDatasets = new Backbone.Collection();
    this.collection = new cdb.admin.Visualizations();
    this.visFetchModel = new VisFetchModel({
      content_type: 'datasets',
      library: this.showLibrary()
    });
    this.localStorage = new LocalStorage();

    this._initBinds();
  },

  viewsReady: function() {
    // nothing to do for this use-case
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
    return !this.localStorage.get('onboarding-create-dataset');
  },

  // For create-listing view
  showLibrary: function() {
    return true;
  },

  // For create-listing view
  showDatasets: function() {
    return false;
  },

  // For create-listing view
  canSelect: function() {
    return true;
  },

  // Get option state (it could be templates, preview or listing)
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

  // For create-footer view
  startUpload: function() {
    cdb.god.trigger('importByUploadData', this.upload.toJSON());
  },

  // For create-listing-import view
  setActiveImportPane: function(option) {
    if (option && this.get('listing') === "import" && this.getImportState() !== option) {
      this.set('option', 'listing.import.' + option);
    }
  },

  // For create-footer view
  isMapType: function() {
    return false;
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
    this.collection.bind('change:selected', this._onItemSelected, this);
    this.visFetchModel.bind('change', this._fetchCollection, this);
    this.bind('change:option', this._maybePrefetchDatasets, this);
    this.bind('change:listing', this._maybePrefetchDatasets, this);
  },

  _maybePrefetchDatasets: function() {
    var isDatasets = this.get('listing') === 'datasets';

    // Fetch collection if it was never fetched (and a search is not applied!)
    if (isDatasets && !this.get('collectionFetched') && !this.visFetchModel.isSearching()) {
      this.set('collectionFetched', true);
      this._fetchCollection();
    }
  },

  _selectedItems: function() {
    return this.collection.where({ selected: true });
  },

  _fetchCollection: function() {
    var params = this.visFetchModel.attributes;

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
      types:          params.library ? 'remote' : 'table'
    });

    this.collection.fetch();
  },

  _onItemSelected: function(changedModel) {
    // Triggers an import immediately
    if (changedModel.get('type') === 'remote') {
      // previously located in listings/datasets/remote_datasets_item_view
      var table = new cdb.admin.CartoDBTableMetadata(changedModel.get('external_source'));
      var d = {
        type: 'remote',
        value: changedModel.get('name'),
        remote_visualization_id: changedModel.get('id'),
        size: table.get('size'),
        create_vis: false
      };
      cdb.god.trigger('importByUploadData', d);
    }
  }

});
