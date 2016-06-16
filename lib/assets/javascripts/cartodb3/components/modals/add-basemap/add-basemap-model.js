var Backbone = require('backbone');

/**
 * Add basemap model
 */
module.exports = Backbone.Model.extend({
  defaults: {
    userLayers: undefined,
    contentPane: 'tabs', // [tabs, loading]
    currentTab: 'xyz' // [xyz, wms, nasa, mapbox, tilejson]
  },

  initialize: function (attrs, opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._userLayersCollection = opts.userLayersCollection;
  },

  _addNewBasemap: function () {
    this.set('contentPane', 'addingNewBasemap');

    // success: function () {
    //   this.trigger('addLayerDone');
    // }.bind(this),
    // error: function () {
    //   this.set('contentPane', 'addBasemapFailed');
    // }.bind(this)
  }
});
