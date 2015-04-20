var cdb = require('cartodb.js');
var _ = require('underscore');
var ImportsModel = require('../../background_importer/imports_model');
var UploadModel = require('../../background_importer/upload_model');
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
    option: 'templates',
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
    this.mapTemplate = new cdb.core.Model();
    this.vis = new cdb.admin.Visualization({ name: 'Untitled map' });

    this.bind('change:mapTemplate', this._onTemplateChange, this);
    this.bind('change:option', this._onOptionChange, this);
    this.mapTemplate.bind('change', function() {
      this.trigger('change:mapTemplate', this);
    }, this);
    this.upload.bind('change', function() {
      this.trigger('change:upload', this);
    }, this);

    this.collection = new cdb.admin.Visualizations(opts.selectedDatasets);
    this.collection.each(function(model) {
      model.set('selected', true);
    });
    this.visFetchModel = new VisFetchModel({
      content_type: 'datasets',
      library: this.showLibrary()
    });
    this.visFetchModel.bind('change', this._fetchCollection, this);
    this.bind('change:option', this.maybePrefetchDatasets, this);
    this.bind('change:listing', this.maybePrefetchDatasets, this);
    this.localStorage = new LocalStorage();
  },

  // For create-content
  createOnboardingView: function() {
    if (!this.localStorage.get('onboarding-create-map')) {
      return new CreateOnboarding({
        localStorage: this.localStorage,
        model: this
      });
    }
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
  createEmptyLabel: function() {
    return 'Create empty map';
  },

  // For create-listing view
  isListingSomething: function() {
    return this.getOption() === 'listing';
  },

  // For create-listing view
  canChangeSelectedState: function(datasetModel) {
    if (datasetModel.get('selected')) {
      return true;
    } else {
      return this._selectedItems().length < this.user.get('max_layers');
    }
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

  // For footer
  showTypeGuessingToggler: function() {
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

  // For create-listing-import view
  getUpload: function() {
    return this.upload.toJSON();
  },

  // For create-footer view
  getSelectedDatasets: function() {
    return this._selectedItems();
  },

  // For create-listing-import view
  setUpload: function(d) {
    if (d && !_.isEmpty(d)) {
      // Set upload properties except create_vis (defined at the beginning)
      this.upload.set(_.omit(d, 'create_vis'));
    } else {
      this.upload.clear();
    }
  },
  getMapTemplate: function() {
    return this.mapTemplate.toJSON();
  },

  setMapTemplate: function(mdl) {
    if (mdl) {
      this.mapTemplate.set(mdl.toJSON());
    }
  },

  createMap: function() {
    if (this._selectedItems().length === 0) {
      return;
    }
    this.set('option', 'loading');
    this._checkCollection();
  },

  // For create-from-scratch view
  titleForCreateFromScratch: function() {
    return 'Create a new map from scratch';
  },

  // For create-from-scratch view
  explainWhatHappensAfterCreatedFromScratch: function() {
    return 'We will redirect you once it finishes';
  },

  // For create-from-scratch view
  labelForCreateFromScratchButton: function() {
    return 'Create map';
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

  // For create-listing view
  maybePrefetchDatasets: function() {
    var isDatasets = this.get('listing') === 'datasets';

    // Fetch collection if it was never fetched (and a search is not applied!)
    if (isDatasets && !this.get('collectionFetched') && !this.visFetchModel.isSearching()) {
      this.set('collectionFetched', true);
      this._fetchCollection();
    }
  },

  _onTemplateChange: function() {
    if (this.mapTemplate.get('short_name')) {
      this.set('option', 'preview');
    } else {
      this.set('option', 'templates');
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
    return this.collection.where({ selected: true });
  },

  _checkCollection: function() {
    var items = this.collection.where({ selected: true, processed: undefined });
    if (items.length > 0) {
      var item = items.pop();
      item.set('processed', true, { silent: true });
      this._importDataset(item);
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
    },{
      success: function(m) {
        self.trigger('mapCreated', m, self);
      },
      error: function(e) {
        self.trigger('mapError', self);
      }
    });
  }

});
