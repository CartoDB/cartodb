var _ = require('underscore');

module.exports = function(MapBase, SubLayerFactory) {
  if (!MapBase) throw new Error('MapBase is required');
  if (!SubLayerFactory) throw new Error('SubLayerFactory is required');

  function NamedMap(named_map, options) {
    MapBase.call(this, options);
    this.options.pngParams.push('auth_token')
    this.options.gridParams.push('auth_token')
    this.setLayerDefinition(named_map, options)
    this.stat_tag = named_map.stat_tag;
  }

  NamedMap.prototype = _.extend({}, MapBase.prototype, {

    getSubLayer: function(index) {
      var layer = this.layers[index];
      // for named maps we don't know how many layers are defined so
      // we create the layer on the fly
      if (!layer) {
        layer = this.layers[index] = {
          options: {}
        };
      }
      layer.sub = layer.sub || SubLayerFactory.createSublayer(layer.type, this, index);
      return layer.sub;
    },

    setLayerDefinition: function(named_map, options) {
      options = options || {}
      this.endPoint = MapBase.BASE_URL + '/named/' + named_map.name;
      this.JSONPendPoint = MapBase.BASE_URL + '/named/' + named_map.name + '/jsonp';
      this.layers = _.clone(named_map.layers) || [];
      for(var i = 0; i < this.layers.length; ++i) {
        var layer = this.layers[i];
        layer.options = layer.options || { 'hidden': layer.visible === false };
        layer.options.layer_name = layer.layer_name;
      }
      this.named_map = named_map;
      var token = named_map.auth_token || options.auth_token;
      if (token) {
        this.setAuthToken(token);
      }
      if(!options.silent) {
        this.invalidate();
      }
    },

    setAuthToken: function(token) {
      if(!this.isHttps()) {
        throw new Error("https must be used when map has token authentication");
      }
      this.options.extra_params = this.options.extra_params || {};
      this.options.extra_params.auth_token = token;
      this.invalidate();
      return this;
    },

    setParams: function(attr, v) {
      var params;
      if (arguments.length === 2) {
        params = {}
        params[attr] = v;
      } else {
        params = attr;
      }
      if (!this.named_map.params) {
        this.named_map.params = {};
      }
      for (var k in params) {
        if (params[k] === undefined || params[k] === null) {
          delete this.named_map.params[k];
        } else {
          this.named_map.params[k] = params[k];
        }
      }
      this.invalidate();
      return this;
    },

    toJSON: function() {
      var payload = this.named_map.params || {};
      for(var i = 0; i < this.layers.length; ++i) {
        var layer = this.layers[i];
        payload['layer' + i] = this._isLayerVisible(layer) ? 1 : 0;
      }
      return payload;
    },

    containInfowindow: function() {
      var layers = this.layers || [];
      for(var i = 0; i < layers.length; ++i) {
        var infowindow = layers[i].infowindow;
        if (infowindow && infowindow.fields && infowindow.fields.length > 0) {
          return true;
        }
      }
      return false;
    },

    containTooltip: function() {
      var layers = this.layers || [];
      for(var i = 0; i < layers.length; ++i) {
        var tooltip = layers[i].tooltip;
        if (tooltip) {
          return true;
        }
      }
      return false;
    },

    setSQL: function(sql) {
      throw new Error("SQL is read-only in NamedMaps");
    },

    setCartoCSS: function(sql) {
      throw new Error("cartocss is read-only in NamedMaps");
    },

    getCartoCSS: function() {
      throw new Error("cartocss can't be accessed in NamedMaps");
    },

    getSQL: function() {
      throw new Error("SQL can't be accessed in NamedMaps");
    },

    setLayer: function(layer, def) {
      var not_allowed_attrs = {'sql': 1, 'cartocss': 1, 'interactivity': 1 };

      for(var k in def.options) {
        if (k in not_allowed_attrs) {
          delete def.options[k];
          throw new Error( k + " is read-only in NamedMaps");
        }
      }
      return MapBase.prototype.setLayer.call(this, layer, def);
    },

    removeLayer: function(layer) {
      throw new Error("sublayers are read-only in Named Maps");
    },

    createSubLayer: function(attrs, options) {
      throw new Error("sublayers are read-only in Named Maps");
    },

    addLayer: function(def, layer) {
      throw new Error("sublayers are read-only in Named Maps");
    },

    // for named maps the layers are always the same (i.e they are
    // not removed to hide) so the number does not change
    getLayerIndexByNumber: function(number) {
      return +number;
    }
  });

  return NamedMap;
};
