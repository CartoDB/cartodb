
(function() {

if(typeof(L) === "undefined") 
  return;

/**
 * leaflet torque layer
 */
var LeafLetTorqueLayer = L.TorqueLayer.extend({

  initialize: function(layerModel, leafletMap) {
    var extra = layerModel.get('extra_params');
    // initialize the base layers
    L.TorqueLayer.prototype.initialize.call(this, {
      table: layerModel.get('table_name'),
      user: layerModel.get('user_name'),
      column: layerModel.get('property'),
      blendmode: layerModel.get('torque-blend-mode'),
      resolution: 1,
      //TODO: manage time columns
      countby: 'count(cartodb_id)',
      sql_api_domain: layerModel.get('sql_api_domain'),
      sql_api_protocol: layerModel.get('sql_api_protocol'),
      sql_api_port: layerModel.get('sql_api_port'),
      tiler_protocol: layerModel.get('tiler_protocol'),
      tiler_domain: layerModel.get('tiler_domain'),
      tiler_port: layerModel.get('tiler_port'),
      stat_tag: layerModel.get('stat_tag'),
      animationDuration: layerModel.get('torque-duration'),
      steps: layerModel.get('torque-steps'),
      sql: layerModel.get('query'),
      visible: layerModel.get('visible'),
      extra_params: {
        api_key: extra ? extra.map_key: ''
      },
      cdn_url: layerModel.get('no_cdn') ? null: (layerModel.get('cdn_url') || cdb.CDB_HOST)
    });

    cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);

    // match leaflet events with backbone events
    this.fire = this.trigger;

    this.setCartoCSS(layerModel.get('tile_style'));
    if (layerModel.get('visible')) {
      this.play();
    }

    this.bind('tilesLoaded', function() {
      this.trigger('load');
    }, this);

  },

  _modelUpdated: function(model) {
    var changed = this.model.changedAttributes();
    if(changed === false) return;
    changed.tile_style && this.setCartoCSS(this.model.get('tile_style'));
    changed['torque-blend-mode'] && this.setBlendMode(this.model.get('torque-blend-mode'));
    changed['torque-duration'] && this.setDuration(this.model.get('torque-duration'));
    changed['torque-steps'] && this.setSteps(this.model.get('torque-steps'));
    changed['property'] && this.setColumn(this.model.get('property'));
    'query' in changed && this.setSQL(this.model.get('query'));
    if ('visible' in changed) 
      this.model.get('visible') ? this.show(): this.hide();
  }



});

_.extend(LeafLetTorqueLayer.prototype, cdb.geo.LeafLetLayerView.prototype);

cdb.geo.LeafLetTorqueLayer = LeafLetTorqueLayer;

})();
