
carto_quotables = [
  'text-name',
  'text-face-name'
];

/**
 * some carto properties depends on others, this function
 * remove or add properties needed to carto works
 */
function manage_carto_properies(props) {
  if(/none/i.test(props['text-name'])) {
    // remove all text-* properties
    for(var p in props) {
      if(/^text-/.test(p)) {
        delete props[p];
      }
    }
  }
}

function simple_polygon_generator(table, props, callback) {

  manage_carto_properies(props);
  var carto_props = _(props).map(function(v, k) {
    if(_.include(carto_quotables, k)) {
      v = "'" + v + "'";
    }
    return "  " + k + ": " + v + ";";
  });
  callback("#" + table.get('name') + "{\n" + carto_props.join('\n') + "\n}");
}

function bubble_generator(table, props, callback) {
  var carto_props = {
   'marker-fill': props['marker-fill'],
   'marker-line-color': props['marker-line-color'],
   'marker-line-width': props['marker-line-width'],
   'marker-line-opacity': props['marker-line-opacity'],
   'marker-opacity': props['marker-opacity'],
   'marker-placement': 'point',
   'marker-type': 'ellipse',
   'marker-allow-overlap': true
  };
  var prop = props['property'];
  var min = props['radius_min'];
  var max = props['radius_max'];
  var values = [];
  var NPOINS = 10;
  //calculate the bubles sizes
  for(var i = 0; i < NPOINS; ++i) {
    var t = i/(NPOINS-1);
    values.push(min + t*(max - min));
  }

  var table_name = table.get('name');
  // generate carto
  simple_polygon_generator(table, carto_props, function(css) {
    table.data().quartiles(NPOINS, prop, function(quartiles)  {
      for(var i = NPOINS - 1; i >= 0; --i) {
        if(quartiles[i] !== undefined) {
          css += "\n#" + table_name +" [ " + prop + " <= " + quartiles[i] + "] {\n"
          css += "   marker-width: " + values[i].toFixed(1) + ";\n}"
        }
      }
      callback(css);
    });
  });
}

function choropleth_generator(table, props, callback) {
  var carto_props = {
   'line-color': props['line-color'],
   'line-opacity': props['line-opacity'],
   'line-width': props['line-width'],
   'polygon-opacity': props['polygon-opacity'],
   'text-name': props['text-name'],
   'text-halo-fill': props['text-halo-fill'],
   'text-halo-radius': props['text-halo-radius'],
   'text-face-name': props['text-face-name'],
   'text-size': props['text-size'],
   'text-fill': props['text-fill']
  }

  var methodMap = {
    '3 Buckets': 3,
    '5 Buckets': 5,
    '7 Buckets': 7
  };

  var prop = props['property'];
  var nquartiles = methodMap[props['method']];
  var ramp = cdb.admin.color_ramps[props['color_ramp']][nquartiles];
  var table_name = table.get('name');

  if(!ramp) {
    cdb.log.error("no colo ramp defined for " + nquartiles + " quartiles");
  }

  simple_polygon_generator(table, carto_props, function(css) {
    table.data().quartiles(nquartiles, prop, function(quartiles)  {
      for(var i = nquartiles - 1; i >= 0; --i) {
        css += "\n#" + table_name +" [ " + prop + " <= " + quartiles[i] + "] {\n"
        css += "   polygon-fill: " + ramp[i] + ";\n}"
      }
      callback(css);
    });
  });
}

function density_generator(table, props, callback) {
  var carto_props = {
   'line-color': props['line-color'],
   'line-opacity': props['line-opacity'],
   'line-width': props['line-width'],
   'polygon-opacity': props['polygon-opacity'],
  }

  var methodMap = {
    '3 Buckets': 3,
    '5 Buckets': 5,
    '7 Buckets': 7
  };

  var nquartiles = methodMap[props['method']];
  var ramp = cdb.admin.color_ramps[props['color_ramp']][nquartiles];
  var table_name = table.get('name');

  if(!ramp) {
    cdb.log.error("no colo ramp defined for " + nquartiles + " quartiles");
  }

  var quartiles_buckets = {
    3: [0, 64, 512],
    5: [0, 8,  32,  128,  512],
    7: [0, 8, 16, 64, 128, 256, 512]
  };
  quartiles = quartiles_buckets[nquartiles];

  
  simple_polygon_generator(table, carto_props, function(css) {
    for(var i = nquartiles - 1; i >= 0; --i) {
      css += "\n#" + table_name +" [ points_count <= " + quartiles[i] + "] {\n"
      css += "   polygon-fill: " + ramp[i] + ";\n}"
    }
    callback(css);
  });
}

cdb.admin.CartoStyles = Backbone.Model.extend({

    defaults: {
      type: 'polygon',
      properties: {
        'polygon-fill': '#FF6600',
        'line-color': '#FFFFFF',
        'line-width': 1,
        'polygon-opacity': 0.7,
        'line-opacity':1
      }
    },

    initialize: function() {
      this.table = this.get('table');
      if(!this.table) {
        throw "table must be passed as param"
        return;
      }
      this.bind('change:properties', this._generateCarto, this);
      this.generators = {};
      this.registerGenerator('polygon', simple_polygon_generator);
      this.registerGenerator('bubble', bubble_generator);
      this.registerGenerator('choropleth', choropleth_generator);
      this.registerGenerator('density', density_generator); // the same generator than choroplet
    },

    // change a property attribute
    attr: function(name, val) {
      var old = this.attributes.properties[name];
      this.attributes.properties[name] = val;
      if(old != val) {
        this.trigger('change:properties', this, this.attributes.properties);
        this.trigger('changes', this);
      }
    },

    registerGenerator: function(name, gen) {
      this.generators[name] = gen;
    },

    /**
     * generate a header to show the user the params carto was
     * generated from
     */
    _generateHeader: function() {
      var c = _t("/**\n * this carto style was generated by cartodb. http://cartodb.com\n");
      c +=       " * genetor type: " + this.get('type') + "\n";
      c +=       " * params: " + JSON.stringify(this.get('properties')) + "\n";
      c +=       " */\n\n";
      return c;
    },

    _generateCarto: function(){
      var self = this;
      var gen = this.generators[this.get('type')];
      if(!gen) {
        cdb.log.error("can't get style generator for " + this.get('type'));
        return;
      }

      gen(this.table, this.get('properties'), function(style) {
        self.set({
          style: self._generateHeader() + style
        });
      })
    },

    /**
     * when cartocss is rendered the generator and properties are written in a comment.
     * This function try to load params from that comment.
     *
     * return true if it is able to load style
     */
    loadFromCartoCSS: function(carto) {
      var genType, params;
      if(!carto)  return false;
      var g = carto.match(/genetor type: (\w+)/);
      if(g) {
        genType = g[1];
      }
      g = carto.match(/params: \{(.*)\}/);
      if(g) {
        try {
          params = JSON.parse("{" + g[1] + "}");
        } catch(e) {
          cdb.log.info("can't parse css options");
        }
      }

      if(params && genType && this.generators[genType]) {
        this.set({
          type: genType,
          properties: params
        });
        return true;
      }
      return false;

    }

});
