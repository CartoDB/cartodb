/**
 * this is a specialization of generic map prepared to hold two layers:
 *  - a base layer
 *  - a data layer which contains the table data
 *
 * cartodb only supports one data layer per map so this will change when
 * that changes
 */

cdb.open.PublicMap = cdb.admin.Map.extend({

  urlRoot: '/api/v1/maps',

  initialize: function() {
    this.bind('change:id', this._fetchLayers, this);
    this.layers = new cdb.admin.Layers();
    this.layers.map = this;
    this.layers.bind('reset', this._layersChanged, this);
    this.geometries = new cdb.geo.Geometries();
  },

  _layersChanged: function() {
    if(this.layers.size() >= 1) {
      this._adjustZoomtoLayer(this.layers.at(0));
      if(this.layers.size() >= 2) {
        this.set({ dataLayer: this.layers.at(1) });
      }
    }
  },

  // fetch related layers
  _fetchLayers: function() {
    this.layers.fetch();
  },

  _fetchOrCreate: function() {},

  /**
   * change base layer and save all the layers to preserve the order
   */
  setBaseLayer: function(layer) {},

  /**
   * not for public
   */
  autoSave: function() {},

  /**
   * not for public
   */
  changeProvider: function(provider, baselayer) {}
});
