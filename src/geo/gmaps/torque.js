
(function() {

if(typeof(google) == "undefined" || typeof(google.maps) == "undefined")
  return;

var GMapsTorqueLayerView = function(layerModel, gmapsMap) {
  cdb.geo.GMapsLayerView.call(this, layerModel, this, gmapsMap);
  torque.GMapsTorqueLayer.call(this, {
      table: layerModel.get('table_name'),
      user: layerModel.get('user_name'),
      column: layerModel.get('property'),
      blendmode: layerModel.get('torque-blend-mode'),
      resolution: 1,
      //TODO: manage time columns
      is_time: false, //layerModel.get('is_time'),
      countby: 'count(cartodb_id)',
      sql_api_domain: layerModel.get('sql_api_domain'),
      sql_api_protocol: layerModel.get('sql_api_protocol'),
      sql_api_port: layerModel.get('sql_api_port'),
      animationDuration: 10,
      map: gmapsMap
  });

  this.setCartoCSS(this.model.get('tile_style'));
  this.play();

};

_.extend(
  GMapsTorqueLayerView.prototype,
  cdb.geo.GMapsLayerView.prototype,
  torque.GMapsTorqueLayer.prototype,
  {

  _update: function() {
    this.setCartoCSS(this.model.get('tile_style'));
    this.setBlendMode(this.model.get('torque-blend-mode'));
  },

  refreshView: function() {
    //TODO: update screen
  },

  onTilesLoaded: function() {
    this.trigger('load');
  }

});


cdb.geo.GMapsTorqueLayerView = GMapsTorqueLayerView;


})();
