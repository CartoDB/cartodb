
(function() {

if(typeof(google) == "undefined" || typeof(google.maps) == "undefined") 
  return;

/**
* base layer for all google maps
*/

var GMapsLayerView = function(layerModel, gmapsLayer, gmapsMap) {
  this.gmapsLayer = gmapsLayer;
  this.map = this.gmapsMap = gmapsMap;
  this.model = layerModel;
  this.model.bind('change', this._update, this);

  this.type = layerModel.get('type') || layerModel.get('kind');
  this.type = this.type.toLowerCase();
};

_.extend(GMapsLayerView.prototype, Backbone.Events);
_.extend(GMapsLayerView.prototype, {

  // hack function to search layer inside google maps layers
  _searchLayerIndex: function() {
    var self = this;
    var index = -1;
    this.gmapsMap.overlayMapTypes.forEach(
      function(layer, i) {
        if (layer == self) {
          index = i;
        }
      }
    );
    return index;
  },

  /**
   * remove layer from the map and unbind events
   */
  remove: function() {
    if(!this.isBase) {
      var self = this;
      var idx = this._searchLayerIndex();
      if(idx >= 0) {
        this.gmapsMap.overlayMapTypes.removeAt(idx);
      } else if (this.gmapsLayer.setMap){
        this.gmapsLayer.setMap(null);
      }
      this.model.unbind(null, null, this);
      this.unbind();
    }
  },

  refreshView: function() {
    var self = this;
    //reset to update
    if(this.isBase) {
      var a = '_baseLayer';
      this.gmapsMap.setMapTypeId(null);
      this.gmapsMap.mapTypes.set(a, this.gmapsLayer);
      this.gmapsMap.setMapTypeId(a);
    } else {
      var idx = this._searchLayerIndex();
      if(idx >= 0) {
        this.gmapsMap.overlayMapTypes.setAt(idx, this);
      }
    }
  },

  reload: function() { this.refreshView() ; },
  _update: function() { this.refreshView(); }


});

cdb.geo.GMapsLayerView = GMapsLayerView;

})();
