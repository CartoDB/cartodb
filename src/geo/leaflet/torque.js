
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
      animationDuration: layerModel.get('torque-duration')
    });

    cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);

    // match leaflet events with backbone events
    this.fire = this.trigger;

    this.setCartoCSS(layerModel.get('tile_style'));
    this.play();

    this.bind('tilesLoaded', function() {
      this.trigger('load');
    }, this);

  },

  _modelUpdated: function(model) {
    var changed = this.model.changedAttributes();
    changed.tile_style && this.setCartoCSS(this.model.get('tile_style'));
    changed['torque-blend-mode'] && this.setBlendMode(this.model.get('torque-blend-mode'));
    changed['torque-duration'] && this.setDuration(this.model.get('torque-duration'));
    changed['torque-steps'] && this.setSteps(this.model.get('torque-steps'));
    changed['property'] && this.setColumn(this.model.get('property'));
  },



});

_.extend(LeafLetTorqueLayer.prototype, cdb.geo.LeafLetLayerView.prototype);

cdb.geo.LeafLetTorqueLayer = LeafLetTorqueLayer;

})();
