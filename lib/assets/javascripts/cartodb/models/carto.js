
carto_quotables = [
  'text-face-name'
];

carto_variables = [
  'text-name'
];

/**
 * some carto properties depends on others, this function
 * remove or add properties needed to carto works
 */
function manage_carto_properies(props) {
  if(/none/i.test(props['text-name'])) {
    // remove all text-* properties
    for(var p in props) {
      if(isTextProperty(p)) {
        delete props[p];
      }
    }
  }
}

function isTextProperty(p) {
  return /^text-/.test(p);
}

function generate_carto_properties(props) {
  return _(props).map(function(v, k) {
    if(_.include(carto_quotables, k)) {
      v = "'" + v + "'";
    }
    if(_.include(carto_variables, k)) {
      v = "[" + v + "]";
    }
    return "  " + k + ": " + v + ";";
  });
}

function filter_props(props, fn) {
  var p = {};
  for(var k in props) {
    var v = props[k];
    if(fn(k, v)) {
      p[k] = v;
    }
  }
  return p;
}

function simple_polygon_generator(table, props, callback) {

  // remove unnecesary properties, for example
  // if the text-name is not present remove all the
  // properties realted to text
  manage_carto_properies(props);

  var text_properties = filter_props(props, function(k, v) { return isTextProperty(k); });
  var general_properties = filter_props(props, function(k, v) { return !isTextProperty(k); });

  generalLayerProps = generate_carto_properties(general_properties);
  textLayerProps = generate_carto_properties(text_properties);

  // layer with non-text properties
  var generalLayer = "#" + table.get('name') + "{\n" + generalLayerProps.join('\n') + "\n}";
  var textLayer = '';
  if(_.size(textLayerProps)) {
    textLayer = "\n\n#" + table.get('name') + "::labels {\n" + textLayerProps.join('\n') + "\n}\n";
  }

  // text properties layer
  callback(generalLayer + textLayer);
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

/**
 * when quartiles are greater than 1<<31 cast to float added .01 
 * at the end. If you append only .0 it is casted to int and it
 * does not work
 */
function normalizeQuartiles(quartiles) {
  var maxNumber = 2147483648; // unsigned (1<<31);
  var normalized = [];
  for(var i = 0;  i < quartiles.length; ++i) {
    var q = quartiles[i];
    if(q > Math.abs(maxNumber)) {
      q = q + ".01";
    }
    normalized.push(q);
  }
  return normalized;
}

function choropleth_generator(table, props, callback) {
  var type = table.geomColumnTypes() && table.geomColumnTypes()[0] || "polygon";

  var carto_props = {
   'line-color': props['line-color'],
   'line-opacity': props['line-opacity'],
   'line-width': props['line-width'],
   'polygon-opacity': type == "line" ? 0 : props['polygon-opacity'],
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

  if(!props['color_ramp']) {
    return;
  }

  var prop = props['property'];
  var nquartiles = methodMap[props['method']];
  var ramp = cdb.admin.color_ramps[props['color_ramp']][nquartiles];
  var table_name = table.get('name');

  if(!ramp) {
    cdb.log.error("no colo ramp defined for " + nquartiles + " quartiles");
  }

  simple_polygon_generator(table, carto_props, function(css) {
    table.data().quartiles(nquartiles, prop, function(quartiles)  {
      quartiles = normalizeQuartiles(quartiles);
      for(var i = nquartiles - 1; i >= 0; --i) {
        css += "\n#" + table_name +" [ " + prop + " <= " + quartiles[i] + "] {\n";

        if (type == "line") {
          css += "   line-color: " + ramp[i] + ";\n}"
        } else {
          css += "   polygon-fill: " + ramp[i] + ";\n}"
        }
      }
      callback(css);
    });
  });
}

/*
 *

     */

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

  var polygon_size = props['polygon-size'];
  var nquartiles = methodMap[props['method']];
  var ramp = cdb.admin.color_ramps[props['color_ramp']][nquartiles];
  var table_name = table.get('name');

  if(!ramp) {
    cdb.log.error("no colo ramp defined for " + nquartiles + " quartiles");
  }

  carto_props['polygon-fill'] = ramp[ramp.length - 1];

  simple_polygon_generator(table, carto_props, function(css) {

    // calculate the buckets for level 10 
    // then all the zooms should use level 10 as reference to calculate the
    // density
    var tmpl = _.template(
      "WITH " +
      "clusters as (" +
        "SELECT cartodb_id,  st_snaptogrid(the_geom_webmercator, <%= polygon_size %> * (40075017/power(2, 10))) as center " +
        "from <%= table_name %> " + 
      ")," +
      "points as (" +
        "SELECT count(cartodb_id) as npoints, count(cartodb_id)/power( <%= polygon_size %> / power(2, 10), 2 ) as density FROM clusters group by st_x(center) || '-' || st_y(center)" +
      ") " +
      "SELECT quartile, max(npoints) as maxAmount, max(density) as maxDensity  FROM " +
      "( " +
          "SELECT npoints, density, ntile(<%= slots %>) over (order by density) as quartile FROM points " +
      ") x " +
      "GROUP BY quartile ORDER BY quartile"
    );
    var sql = tmpl({
        slots: nquartiles,
        table_name: table.get('name'),
        polygon_size: polygon_size
    });
    console.log(sql);

    table.data()._sqlQuery(sql, function(data) {
      // extract quartiles by zoom level
      var rows = data.rows;
      var quartiles = [];
      for(var i = 0; i < rows.length; ++i) {
        quartiles.push(rows[i].maxdensity);
      }

      quartiles = normalizeQuartiles(quartiles);

      css += "\n#" + table_name + "{\n"
      for(var i = nquartiles - 1; i >= 0; --i) {
        if(quartiles[i] !== undefined) {
          css += "  [points_density <= " + quartiles[i] + "] { polygon-fill: " + ramp[i] + ";  }\n";
        }
      }
      css += "\n}"
      callback(css);
    });
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
     * generate a informative header
     */
    _generateHeader: function() {
      var c = "/** " + this.get('type') + " visualization */\n\n";
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
