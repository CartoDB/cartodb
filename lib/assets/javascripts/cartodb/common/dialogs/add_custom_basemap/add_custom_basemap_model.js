var cdb = require('cartodb.js');
var Backbone = require('backbone');
var XYZModel = require('./xyz_model.js');

/**
 * View model for the add-custom-basemap view
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    map: undefined,
    baseLayers: undefined,
    tabs: undefined,
    currentView: 'tabs',
    currentTab: 'xyz'
  },

  initialize: function(attrs) {
    this.elder('initialize');
    if (!attrs.map) throw new Error('map is required');
    if (!attrs.baseLayers) throw new Error('baseLayers is required');
    this._initTabs();
  },

  activeTabModel: function() {
    return this.get('tabs').where({ name: this.get('currentTab') })[0];
  },

  saveLayer: function(layer, callbacks) {
    var bbox = layer.get('bounding_boxes');
    if (bbox && bbox.length === 4) {
      this.get('map').setBounds([
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]]
      ]);
    }

    // Save layer after adding to baseLayers collection, so save URL resolves to the expected endpoint.
    this.get('baseLayers').add(layer);
    layer.save()
      .done(callbacks.success)
      .fail(callbacks.error);
    this.get('map').changeProvider('leaflet', layer.clone());
  },

  _initTabs: function() {
    var tabs = new Backbone.Collection([
      new XYZModel({
        baseLayers: this.get('baseLayers')
      })
    ]);

    this.set({
      tabs: tabs,
      currentTab: tabs.first().get('name')
    });
  }
});
