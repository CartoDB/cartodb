var cdb = require('cartodb.js');
var Backbone = require('backbone');
var UploadModel = require('new_dashboard/background_importer/upload_model');

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
    type:           'map',        // Type of create dialog (map or dataset)
    option:         'templates',  // General state of the dialog (templates, listing or preview)
    listingOption:  ''            // Listing option selected (list or import)
  },

  initialize: function(val, opts) {
    this.user = opts && opts.user || {};
    this.selectedDatasets = new Backbone.Collection();
    this.upload = new UploadModel({}, { user: this.user });
    this.mapTemplate = new cdb.core.Model();

    this._initBinds();
  },

  _initBinds: function() {
    this.bind('change:option', this._onOptionChange, this);
    this.bind('change:mapTemplate', this._onTemplateChange, this);
    this.selectedDatasets.bind('add remove',function() {
      this.trigger('change:selectedDatasets', this);
    }, this);
    this.mapTemplate.bind('change',function() {
      this.trigger('change:mapTemplate', this);
    }, this);
  },

  _onOptionChange: function() {
    if (this.get('option') === "templates") {
      this.mapTemplate.clear();
    }
  },

  _onTemplateChange: function() {
    if (this.mapTemplate.get('short_name')) {
      this.set('option', 'preview');
    } else {
      this.set('option', 'templates');
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

  getMapTemplate: function() {
    return this.mapTemplate.toJSON();
  },

  setMapTemplate: function(mdl) {
    if (mdl) {
      this.mapTemplate.set(mdl.toJSON());
    }
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