var cdb = require('cartodb.js');
var UploadModel = require('../../upload_model');
var RouterModel = require('../../../new_dashboard/router/model');

/**
 * Add layer model
 *
 * "Implements" the CreateListingModel.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    contentPane: 'listing', // [listing, addingLayer]
    listing: 'datasets', // [import, datasets, scratch]
    loadingTitle: 'Adding layer…',
    collectionFetched: false,
    activeImportPane: 'file'
  },

  initialize: function(attrs, opts) {
    this.user = opts.user;
    this.vis = opts.vis;
    this.map = opts.map;

    this.upload = new UploadModel({
      // TODO: create_vis, extract post-upload strategy for UploadModel or something?
      create_vis: false
    }, {
      user: this.user
    });

    this.upload.bind('change', function() {
      this.trigger('change:upload', this);
    }, this);

    this.collection = new cdb.admin.Visualizations();
    this.collection.bind('change:selected', this._onItemSelected, this);
    this.routerModel = new RouterModel({
      content_type: 'datasets',
      library: this.showLibrary()
    }, {
      dashboardUrl: this.user.viewUrl().dashboard()
    });
    this.routerModel.bind('change', this._fetchCollection, this);
    this.bind('change:listing', this.maybePrefetchDatasets);
  },

  // For create-listing view
  canChangeSelectedState: function() {
    return true;
  },

  // For create-listing view
  showLibrary: function() {
    return false;
  },

  // For create-listing view
  showDatasets: function() {
    return true;
  },

  createEmptyLabel: function() {
    return 'Add an empty layer';
  },

  // For create-listing view
  isListingSomething: function() {
    return true;
  },

  // For create-listing-import view
  setActiveImportPane: function(name) {
    this.set('activeImportPane', name);
  },

  // For create-listing-import view
  setUpload: function() {
    // TODO: required for upload view, what to do?
  },

  // For create-from-scratch view
  titleForCreateFromScratch: function() {
    return 'Add an empty layer';
  },

  // For create-from-scratch view
  explainWhatHappensAfterCreatedFromScratch: function() {
    return 'An empty dataset will be created for the new layer, the new layer will be available once the dataset is created';
  },

  // For create-from-scratch view
  labelForCreateFromScratchButton: function() {
    return 'Add layer';
  },

  // For create-from-scratch view
  createFromScratch: function() {
    // TODO how to setup an empty layer/dataset?
    this._addNewLayer();
  },

  // For create-listing view
  maybePrefetchDatasets: function() {
    if (this.get('listing') === 'datasets' && !this.get('collectionFetched') && !this.routerModel.isSearching()) {
      this.set('collectionFetched', true);
      this._fetchCollection();
    }
  },

  _fetchCollection: function() {
    var params = this.routerModel.attributes;
    var types;

    if (this.routerModel.isSearching()) {
      // Supporting search in data library and user datasets at the same time
      types = 'table,remote';
    } else {
      types = params.library ? 'remote' : 'table';
    }

    this.collection.options.set({
      locked:     '',
      q:          params.q,
      page:       params.page || 1,
      tags:       params.tag,
      per_page:   this.collection['_TABLES_PER_PAGE'],
      shared:     params.shared,
      only_liked: params.liked,
      order:      'updated_at',
      type:       '',
      types:      types
    });

    this.collection.fetch();
  },

  _onItemSelected: function(changedModel, aModelWasSelected) {
    if (aModelWasSelected) {
      // selected => add as a new layer directly
      if (changedModel.get('type') === 'remote') {
        // TODO: implement logic, this.vis vs. import handling...
        alert('TBD import dataset and create layer afterwards');
      } else {
        this._addNewLayer(changedModel);
      }
    }
  },

  _addNewLayer: function(vis) {
    this.set('contentPane', 'addingLayer');

    var tableName = vis.tableMetadata().get('name');
    var self = this;
    this.map.addCartodbLayerFromTable(tableName, this.user.get('username'), {
      vis: this.vis,
      success: function() {
        // layers need to be saved because the order may changed
        self.map.layers.saveLayers();
        self.trigger('addLayerDone');
      },
      error: function(err, forbidden) {
        self.trigger('addLayerFail', err, forbidden);
      }
    });
  }

});
