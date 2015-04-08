
(function() {

if(typeof(google) == "undefined" || typeof(google.maps) == "undefined")
  return;

var GMapsTorqueLayerView = function(layerModel, gmapsMap) {

  var extra = layerModel.get('extra_params');
  layerModel.attributes.attribution = cdb.config.get('cartodb_attributions');
  cdb.geo.GMapsLayerView.call(this, layerModel, this, gmapsMap);

  var query = this._getQuery(layerModel);
  torque.GMapsTorqueLayer.call(this, {
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
      maps_api_template: layerModel.get('maps_api_template'),
      stat_tag: layerModel.get('stat_tag'),
      animationDuration: layerModel.get('torque-duration'),
      steps: layerModel.get('torque-steps'),
      sql: query,
      visible: layerModel.get('visible'),
      extra_params: {
        api_key: extra ? extra.map_key: ''
      },
      map: gmapsMap,
      cartodb_logo: layerModel.get('cartodb_logo'),
      attribution: layerModel.get('attribution'),
      cdn_url: layerModel.get('no_cdn') ? null: (layerModel.get('cdn_url') || cdb.CDB_HOST),
      cartocss: layerModel.get('cartocss') || layerModel.get('tile_style'),
      named_map: layerModel.get('named_map'),
      auth_token: layerModel.get('auth_token'),
      no_cdn: layerModel.get('no_cdn')
  });

  //this.setCartoCSS(this.model.get('tile_style'));
  if (layerModel.get('visible')) {
    this.play();
  }

};

_.extend(
  GMapsTorqueLayerView.prototype,
  cdb.geo.GMapsLayerView.prototype,
  torque.GMapsTorqueLayer.prototype,
  {

  _update: function() {
    var changed = this.model.changedAttributes();
    if(changed === false) return;
    changed.tile_style && this.setCartoCSS(this.model.get('tile_style'));
    if ('query' in changed || 'query_wrapper' in changed) {
      this.setSQL(this._getQuery(this.model));
    }
    if ('visible' in changed) 
      this.model.get('visible') ? this.show(): this.hide();
  },

  _getQuery: function(layerModel) {
    var query = layerModel.get('query');
    var qw = layerModel.get('query_wrapper');
    if(qw) {
      query = _.template(qw)({ sql: query || ('select * from ' + layerModel.get('table_name')) });
    }
    return query;
  },

  refreshView: function() {
    //TODO: update screen
  },

  onAdd: function() {
    torque.GMapsTorqueLayer.prototype.onAdd.apply(this);
    // Add CartoDB logo
    if (this.options.cartodb_logo != false)
      cdb.geo.common.CartoDBLogo.addWadus({ left: 74, bottom:8 }, 2000, this.map.getDiv())
  },

  onTilesLoaded: function() {
    //this.trigger('load');
    Backbone.Events.trigger.call(this, 'load');
  },

  onTilesLoading: function() {
    Backbone.Events.trigger.call(this, 'loading');
  }

});


cdb.geo.GMapsTorqueLayerView = GMapsTorqueLayerView;


})();
