
(function() {

if(typeof(L) === "undefined") 
  return;

/**
 * leaflet torque layer
 */
var LeafLetTorqueLayer = L.TorqueLayer.extend({

  initialize: function(layerModel, leafletMap) {
    // initialize the base layers
    L.TorqueLayer.prototype.initialize.call(this, {
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
      animationDuration: 10
    });

    cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);

    // match leaflet events with backbone events
    this.fire = this.trigger;

    this.setCartoCSS(layerModel.get('tile_style'));
    this.play();

  },

  _modelUpdated: function() {
    //TODO: update here torque layer parameters
    this.setCartoCSS(this.model.get('tile_style'));
  },

});

_.extend(LeafLetTorqueLayer.prototype, cdb.geo.LeafLetLayerView.prototype);

cdb.geo.LeafLetTorqueLayer = LeafLetTorqueLayer;

})();
