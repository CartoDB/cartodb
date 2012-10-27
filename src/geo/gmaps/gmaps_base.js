
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

  /**
   * remove layer from the map and unbind events
   */
  remove: function() {
    if(!this.isBase) {
      this.gmapsMap.overlayMapTypes.removeAt(this.index);
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
      self.gmapsMap.overlayMapTypes.forEach(
        function(layer, i) {
          if (layer == self) {
            self.gmapsMap.overlayMapTypes.setAt(i, self);
            return;
          }
        }
      );
    }
  },

  /*

  show: function() {
    this.gmapsLayer.show();
  },

  hide: function() {
    this.gmapsLayer.hide();
  },
  */

  reload: function() { this.refreshView() ; },
  _update: function() { this.refreshView(); }


});

cdb.geo.GMapsLayerView = GMapsLayerView;

})();
