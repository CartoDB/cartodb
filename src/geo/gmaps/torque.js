
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
      animationDuration: layerModel.get('torque-duration'),
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
    var changed = this.model.changedAttributes();
    changed.tile_style && this.setCartoCSS(this.model.get('tile_style'));
    changed['torque-blend-mode'] && this.setBlendMode(this.model.get('torque-blend-mode'));
    changed['torque-duration'] && this.setDuration(this.model.get('torque-duration'));
    changed['torque-steps'] && this.setSteps(this.model.get('torque-steps'));
    changed['property'] && this.setColumn(this.model.get('property'));
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
