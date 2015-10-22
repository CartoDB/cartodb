var _ = require('underscore');

module.exports = function(MapBase, CARTOCSS_DEFAULT_VERSION) {
  if (!MapBase) throw new Error('MapBase is required');
  if (!CARTOCSS_DEFAULT_VERSION) throw new Error('CARTOCSS_DEFAULT_VERSION is required');

  // TODO: This is actually an AnonymousMap -> Rename?
  function LayerDefinition(layerDefinition, options) {
    MapBase.call(this, options);
    this.endPoint = MapBase.BASE_URL;
    this.setLayerDefinition(layerDefinition, { silent: true });
  }

  /**
   * Generates the MapConfig definition for a list of sublayers.
   *
   * ``sublayers`` should be an array, an exception is thrown otherwise.
   *
   */
  LayerDefinition.layerDefFromSubLayers = function(sublayers) {

    if(!sublayers || sublayers.length === undefined) throw new Error("sublayers should be an array");

    sublayers = _.map(sublayers, function(sublayer) {
      var type = sublayer.type;
      delete sublayer.type;
      return {
        type: type,
        options: sublayer
      }
    });

    var layerDefinition = {
      version: '1.3.0',
      stat_tag: 'API',
      layers: sublayers
    }

    return new LayerDefinition(layerDefinition, {}).toJSON();
  };

  LayerDefinition.prototype = _.extend({}, MapBase.prototype, {

    setLayerDefinition: function(layerDefinition, options) {
      options = options || {};
      this.version = layerDefinition.version || '1.0.0';
      this.stat_tag = layerDefinition.stat_tag;
      this.layers = _.clone(layerDefinition.layers);
      if(!options.silent) {
        this._definitionUpdated();
      }
    },

    toJSON: function() {
      var obj = {};
      obj.version = this.version;
      if(this.stat_tag) {
        obj.stat_tag = this.stat_tag;
      }
      obj.layers = [];
      var layers = this.visibleLayers();
      for(var i = 0; i < layers.length; ++i) {
        var sublayer = this.getSubLayer(this.getLayerNumberByIndex(i));
        obj.layers.push(sublayer.toJSON());
      }
      return obj;
    },

    removeLayer: function(layer) {
      if(layer < this.getLayerCount() && layer >= 0) {
        this.layers.splice(layer, 1);
        this.interactionEnabled.splice(layer, 1);
        this._reorderSubLayers();
        this.invalidate();
      }
      return this;
    },

    _reorderSubLayers: function() {
      for(var i = 0; i < this.layers.length; ++i) {
        var layer = this.layers[i];
        if(layer.sub) {
          layer.sub._setPosition(i);
        }
      }
    },

    addLayer: function(def, index) {
      index = index === undefined ? this.getLayerCount(): index;
      if(index <= this.getLayerCount() && index >= 0) {

        var type = def.type || 'cartodb';
        delete def.type;

        this.layers.splice(index, 0, {
          type: type,
          options: def
        });

        var sublayer = this.getSubLayer(index);
        if (sublayer.isValid()) {
          this._definitionUpdated();
        } else { // Remove it from the definition
          sublayer.remove();
          throw 'Layer definition should contain all the required attributes';
        }
      }
      return this;
    },

    /**
     * set interactivity attributes for a layer.
     * if attributes are passed as first param layer 0 is
     * set
     */
    setInteractivity: function(layer, attributes) {
      if(attributes === undefined) {
        attributes = layer;
        layer = 0;
      }

      if(layer >= this.getLayerCount() && layer < 0) {
        throw new Error("layer does not exist");
      }

      if(typeof(attributes) == 'string') {
        attributes = attributes.split(',');
      }

      for(var i = 0; i < attributes.length; ++i) {
        attributes[i] = attributes[i].replace(/ /g, '');
      }

      this.layers[layer].options.interactivity = attributes;
      this._definitionUpdated();
      return this;
    },

    setQuery: function(layer, sql) {
      if(sql === undefined) {
        sql = layer;
        layer = 0;
      }
      this.layers[layer].options.sql = sql
      this._definitionUpdated();
    },

    getQuery: function(layer) {
      layer = layer || 0;
      return this.layers[layer].options.sql
    },

    /**
     * Change style of the tiles
     * @params {style} New carto for the tiles
     */
    setCartoCSS: function(layer, style, version) {
      if(version === undefined) {
        version = style;
        style = layer;
        layer = 0;
      }

      version = version || CARTOCSS_DEFAULT_VERSION;

      this.layers[layer].options.cartocss = style;
      this.layers[layer].options.cartocss_version = version;
      this._definitionUpdated();
    },

    /**
     * adds a new sublayer to the layer with the sql and cartocss params
     */
    createSubLayer: function(attrs, options) {
      this.addLayer(attrs);
      return this.getSubLayer(this.getLayerCount() - 1);
    }
  });

  return LayerDefinition;
};
