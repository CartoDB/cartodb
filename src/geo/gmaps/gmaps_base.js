
(function() {
/**
* base layer for all google maps
*/

var GMapsLayerView = function(layerModel, gmapsLayer, gmapsMap) {
  this.gmapsLayer = gmapsLayer;
  this.gmapsMap = gmapsMap;
  this.model = layerModel;
  this.model.bind('change', this._update, this);
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
    //reset to update
    if(this.isBase) {
      var a = '_baseLayer';
      this.gmapsMap.setMapTypeId(null);
      this.gmapsMap.mapTypes.set(a, this.gmapsLayer);
      this.gmapsMap.setMapTypeId(a);
    } else {
      this.gmapsMap.overlayMapTypes.setAt(this.index, this.gmapsLayer);
    }
  },

  show: function() {
    this.gmapsLayer.show();
  },

  hide: function() {
    this.gmapsLayer.hide();
  },

  reload: function() { this.refreshView() ; }

});

cdb.geo.GMapsLayerView = GMapsLayerView;

})();
