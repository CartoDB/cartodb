var cdb = require('cartodb.js');
var Backbone = require('backbone');

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
    type: 'map',
    option: 'templates'
  },

  initialize: function() {
    this.selectedDatasets = new Backbone.Collection();
    this.upload = new cdb.core.Model();
    this.mapTemplate = new cdb.core.Model();
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