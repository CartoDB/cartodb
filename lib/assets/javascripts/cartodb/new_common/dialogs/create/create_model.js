var cdb = require('cartodb.js');
var Backbone = require('backbone');
var UploadModel = require('../../upload_model');
var CreateMapModel = require('./create_map_model');

/**
 *  Create model
 *
 *  - Store the state of the dialog (templates, listing, preview).
 *  - Set the type of the create dialog (dataset | map).
 *  - Store the selected datasets for a map creation.
 *  - Store the upload info for a dataset creation.
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'map',          // Type of create dialog (map or dataset)
    option: 'templates',  // General state of the dialog
    /*

    OPTION:

      - templates
      - preview
      - listing
        · list
          * datasets
          * shared
          * liked
          * library
        · import
          * file
          * twitter
          ...
        · scratch

    */
  },

  initialize: function(val, opts) {
    this.user = opts && opts.user || {};
    this.selectedDatasets = new Backbone.Collection(opts && opts.selectedDatasets);
    this.upload = new UploadModel({
      // Only create a new visualization when 
      // dialog purpose is for creating a new map
      create_vis: val.type === "map"
    }, {
      user: this.user
    });
    this.mapTemplate = new cdb.core.Model();
    this.vis = new cdb.admin.Visualization({ name: 'Untitled map' });

    this._initBinds();
  },

  _initBinds: function() {
    this.bind('change:mapTemplate', this._onTemplateChange, this);
    this.bind('change:option', this._onOptionChange, this);
    this.selectedDatasets.bind('add remove',function() {
      this.trigger('change:selectedDatasets', this);
    }, this);
    this.mapTemplate.bind('change',function() {
      this.trigger('change:mapTemplate', this);
    }, this);
    this.upload.bind('change', function() {
      this.trigger('change:upload', this);
    }, this);

    // this.add_related_model(this.mapTemplate);
    // this.add_related_model(this.selectedDatasets);
    // this.add_related_model(this.upload);
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

  // Get listing state (it could be list or import)
  getListingState: function() {
    var option = this.get('option');
    var states = option.split('.');

    if (states.length > 0 && states.length < 4 && states[0] === "listing" ) {
      return states[1];
    }

    return '';
  },

  setListingState: function(option) {
    if (option && this.getOption() === "listing" && this.getListingState() !== option) {
      this.set('option', 'listing.' + option);
    }
  },

  // Get datasets state (it could be any of the possibilities of the router model)
  getDatasetsState: function() {
    var option = this.get('option');
    var states = option.split('.');

    if (states.length > 0 && states.length < 4 && states[0] === "listing" && states[1] === "list") {
      return states[2];
    }

    return '';
  },

  setDatasetsState: function(option) {
    if (option && this.getListingState() === "list" && this.getDatasetsState() !== option) {
      this.set('option', 'listing.list.' + option);
    }
  },

  // Get import state (it could be any of the possibilities of the import options, as in scratch, dropbox, etc...)
  getImportState: function() {
    var option = this.get('option');
    var states = option.split('.');

    if (states.length > 0 && states.length < 4 && states[0] === "listing" && states[1] === "import") {
      return states[2];
    }

    return '';
  },

  setImportState: function(option) {
    if (option && this.getListingState() === "import" && this.getImportState() !== option) {
      this.set('option', 'listing.import.' + option);
    }
  },

  _onTemplateChange: function() {
    if (this.mapTemplate.get('short_name')) {
      this.set('option', 'preview');
    } else {
      this.set('option', 'templates');
    }
  },

  _onOptionChange: function(mdl, option) {
    if (option !== "preview" && this.mapTemplate.get('name')) {
      this.mapTemplate.clear({ silent: true });
    }
  },

  isDatasetType: function() {
    return this.get('type') === "dataset"
  },

  isMapType: function() {
    return this.get('type') === "map"
  },

  getUpload: function() {
    return this.upload.toJSON();
  },

  getSelectedDatasets: function() {
    return this.selectedDatasets.toJSON();
  },

  addSelectedDataset: function(mdl) {
    if (this.user.get('max_layers') > this.selectedDatasets.size()) {
      this.selectedDatasets.add(mdl);
      return true;
    }
    return false;
  },

  removeSelectedDataset: function(mdl) {
    this.selectedDatasets.remove(mdl);
    return true;
  },

  isDatasetSelected: function(mdl) {
    if (!mdl) {
      return false;
    }

    var datasetsFound = this.selectedDatasets.where({ id: mdl.get('id') });

    if (datasetsFound.length === 1) {
      return true;
    }

    return false;
  },

  getMapTemplate: function() {
    return this.mapTemplate.toJSON();
  },

  setUpload: function(d) {
    if (d && !_.isEmpty(d)) {
      // Set upload properties except create_vis (defined at the beginning)
      this.upload.set(_.omit(d, 'create_vis'));
    } else {
      this.upload.clear();
    }
  },

  setMapTemplate: function(mdl) {
    if (mdl) {
      this.mapTemplate.set(mdl.toJSON());
    }
  },

  createDataset: function() {
    this.trigger('creatingDataset', 'dataset', this);
    this.set('option','loading');
    
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

  createMap: function() {
    if (this.getSelectedDatasets().length === 0) {
      return;
    } 

    this.set('option','loading');

    var createMap = new CreateMapModel({
      selectedDatasets: this.getSelectedDatasets()
    }, {
      user: this.user
    });

    createMap.bind('importingRemote', function(d) {
      this.trigger('importingRemote', d, this);
    }, this);
    createMap.bind('importFailed', function(d) {
      this.trigger('importFailed', d, this);
    }, this);
    createMap.bind('creatingMap', function(d) {
      this.trigger('creatingMap', d, this);
    }, this);
    createMap.bind('mapError', function(d) {
      this.trigger('mapError', d, this);
    }, this);
    createMap.bind('mapCreated', function(vis, d) {
      this.trigger('mapCreated', vis, this);
    }, this);

    createMap.start();
  },

  parse: function() {
    return {
      type: this.get('type'),
      option: this.get('option'),
      upload: this.upload.toJSON(),
      selectedDatasets: this.selectedDatasets.toJSON(),
      mapTemplate: this.mapTemplate.toJSON()
    }
  }

});
