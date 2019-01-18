
(function() {
  /**
  * base layer for all leaflet layers
  */
  var LeafLetLayerView = function(layerModel, leafletLayer, leafletMap) {
    this.leafletLayer = leafletLayer;
    this.leafletMap = leafletMap;
    this.model = layerModel;

    this.setModel(layerModel);

    this.type = layerModel.get('type') || layerModel.get('kind');
    this.type = this.type.toLowerCase();
  };

  _.extend(LeafLetLayerView.prototype, Backbone.Events);
  _.extend(LeafLetLayerView.prototype, {

    setModel: function(model) {
      if (this.model) {
        this.model.unbind('change', this._modelUpdated, this);
      }
      this.model = model;
      this.model.bind('change', this._modelUpdated, this);
    },

    /**
    * remove layer from the map and unbind events
    */
    remove: function() {
      this.leafletMap.removeLayer(this.leafletLayer);
      this.trigger('remove', this);
      this.model.unbind(null, null, this);
      this.unbind();
    },
    /*

    show: function() {
      this.leafletLayer.setOpacity(1.0);
    },

    hide: function() {
      this.leafletLayer.setOpacity(0.0);
    },
    */

    /**
     * reload the tiles
     */
    reload: function() {
      this.leafletLayer.redraw();
    }

  });


  cdb.geo.LeafLetLayerView = LeafLetLayerView;


})();
