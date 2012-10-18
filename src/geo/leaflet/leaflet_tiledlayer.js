
(function() {

if(typeof(L) == "undefined") 
  return;

var LeafLetTiledLayerView = L.TileLayer.extend({

  initialize: function(layerModel, leafletMap) {
    L.TileLayer.prototype.initialize.call(this, layerModel.get('urlTemplate'), {
      tms: layerModel.get('tms')
    });
    cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);
  }

});

_.extend(LeafLetTiledLayerView.prototype, cdb.geo.LeafLetLayerView.prototype, {

  _modelUpdated: function() {
    _.defaults(this.leafletLayer.options, _.clone(this.model.attributes));
    this.leafletLayer.setUrl(this.model.get('urlTemplate'));
  }

});

cdb.geo.LeafLetTiledLayerView = LeafLetTiledLayerView;

})();
