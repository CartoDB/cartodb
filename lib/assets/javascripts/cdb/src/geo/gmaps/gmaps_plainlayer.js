
(function() {

if(typeof(google) == "undefined" || typeof(google.maps) == "undefined") 
  return;

var GMapsPlainLayerView = function(layerModel, gmapsMap) {
  this.color = layerModel.get('color')
  cdb.geo.GMapsLayerView.call(this, layerModel, this, gmapsMap);
};

_.extend(
  GMapsPlainLayerView.prototype,
  cdb.geo.GMapsLayerView.prototype, {

  _update: function() {
    this.color = this.model.get('color')
    this.refreshView();
  },

  getTile: function(coord, zoom, ownerDocument) {
      var div = document.createElement('div');
      div.style.width = this.tileSize.x;
      div.style.height = this.tileSize.y;
      div['background-color'] = this.color;
      return div;
  },

  tileSize: new google.maps.Size(256,256),
  maxZoom: 100,
  minZoom: 0,
  name:"plain layer",
  alt: "plain layer"
});

cdb.geo.GMapsPlainLayerView = GMapsPlainLayerView;

})();
