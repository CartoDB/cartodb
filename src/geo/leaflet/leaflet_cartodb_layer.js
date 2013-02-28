
(function() {

if(typeof(L) == "undefined")
  return;

L.CartoDBLayer = L.CartoDBGroupLayer.extend({

  options: {
    query:          "SELECT * FROM {{table_name}}",
    opacity:        0.99,
    auto_bound:     false,
    attribution:    "CartoDB",
    debug:          false,
    visible:        true,
    added:          false,
    extra_params:   {}
  },


  initialize: function (options) {
    if (!options.table_name || !options.map) {
      if (options.debug) {
        throw('cartodb-leaflet needs at least a CartoDB table name and the Leaflet map object :(');
      } else { return }
    }

    L.CartoDBGroupLayer.prototype.initialize.call(this);
  },


  /**
   * Change the query when clicks in a feature
   * @params {Boolean | String} New sql for the request
   */
  setInteractivity: function(value) {

    if (!this.options.added) {
      if (this.options.debug) {
        throw('the layer is not still added to the map');
      } else { return }
    }

    if (!isNaN(value)) {
      if (this.options.debug) {
        throw(value + ' is not a valid setInteractivity value');
      } else { return }
    }

    this.setOptions({
      interactivity: value
    });

  },


  /**
   * Active or desactive interaction
   * @params {Boolean} Choose if wants interaction or not
   */
  setInteraction: function(enable) {
    this.setOptions({
      interaction: enable
    })
  },

  /**
   * Change multiple options at the same time
   * @params {Object} New options object
   */
  setOptions: function(opts) {

    if (typeof opts != "object" || opts.length) {
      throw new Error(opts + ' options has to be an object');
    }

    L.Util.setOptions(this, opts);

    if(opts.interactivity) {
      var i = opts.interactivity;
      this.options.interactivity = i.join ? i.join(','): i;
    }
    if(opts.opacity !== undefined) {
      this.setOpacity(this.options.opacity);
    }

    // Update tiles
    if(opts.query != undefined || opts.style != undefined || opts.tile_style != undefined || opts.interactivity != undefined || opts.interaction != undefined) {
      this.__update();
    }
  },


  /**
   * Returns if the layer is visible or not
   */
  isVisible: function() {
    return this.options.visible;
  },


  /**
   * Returns if the layer belongs to the map
   */
  isAdded: function() {
    return this.options.added;
  }

});

/**
 * leatlet cartodb layer
 */

var LeafLetLayerCartoDBView = L.CartoDBLayer.extend({
  //var LeafLetLayerCartoDBView = function(layerModel, leafletMap) {
  initialize: function(layerModel, leafletMap) {
    var self = this;

    _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

    // CartoDB new attribution,
    // also we have the logo
    layerModel.attributes.attribution = "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>";

    var opts = _.clone(layerModel.attributes);

    opts.map =  leafletMap;

    var // preserve the user's callbacks
    _featureOver  = opts.featureOver,
    _featureOut   = opts.featureOut,
    _featureClick = opts.featureClick;

    opts.featureOver  = function() {
      _featureOver  && _featureOver.apply(this, arguments);
      self.featureOver  && self.featureOver.apply(this, arguments);
    };

    opts.featureOut  = function() {
      _featureOut  && _featureOut.apply(this, arguments);
      self.featureOut  && self.featureOut.apply(this, arguments);
    };

    opts.featureClick  = function() {
      _featureClick  && _featureClick.apply(this, arguments);
      self.featureClick  && self.featureClick.apply(opts, arguments);
    };

    L.CartoDBLayer.prototype.initialize.call(this, opts);
    cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);

  },

  _modelUpdated: function() {
    var attrs = _.clone(this.model.attributes);
    this.leafletLayer.setOptions(attrs);
  },

  featureOver: function(e, latlon, pixelPos, data) {
    // dont pass leaflet lat/lon
    this.trigger('featureOver', e, [latlon.lat, latlon.lng], pixelPos, data);
  },

  featureOut: function(e) {
    this.trigger('featureOut', e);
  },

  featureClick: function(e, latlon, pixelPos, data) {
    // dont pass leaflet lat/lon
    this.trigger('featureClick', e, [latlon.lat, latlon.lng], pixelPos, data);
  },

  reload: function() {
    this.model.invalidate();
    //this.redraw();
  },

  error: function(e) {
    this.trigger('error', e?e.error:'unknown error');
    this.model.trigger('tileError', e?e.error:'unknown error');
  },

  tilesOk: function(e) {
    this.model.trigger('tileOk');
  },

  includes: [
    cdb.geo.LeafLetLayerView.prototype,
    CartoDBLayerCommon.prototype,
    Backbone.Events
  ]

});

/*_.extend(L.CartoDBLayer.prototype, CartoDBLayerCommon.prototype);

_.extend(
  LeafLetLayerCartoDBView.prototype,
  cdb.geo.LeafLetLayerView.prototype,
  L.CartoDBLayer.prototype,
  Backbone.Events, // be sure this is here to not use the on/off from leaflet

  */
cdb.geo.LeafLetLayerCartoDBView = LeafLetLayerCartoDBView;

})();
