

carto_quotables = [
  'text-face-name'
];

carto_variables = [
  'text-name'
];

var carto_functionMap= {
  'Equal Interval': 'quartiles',
  'Jenks': 'jenkBins',
  'Heads/Tails': 'headTails',
  'Quantile': 'quantileBins'
};

DEFAULT_QFUNCTION = carto_functionMap['Quantile']

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

  if(/none/i.test(props['polygon-comp-op'])) {
    delete props['polygon-comp-op'];
  }
  if(/none/i.test(props['line-comp-op'])) {
    delete props['line-comp-op'];
  }
  if(/none/i.test(props['marker-comp-op'])) {
    delete props['marker-comp-op'];
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
  // properties related to text
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

function intensity_generator(table, props, callback) {
  var table_name = table.get('name');

  // remove unnecesary properties, for example
  // if the text-name is not present remove all the
  // properties related to text
  manage_carto_properies(props);

  var carto_props = {
    'marker-fill': props['marker-fill'],
    'marker-width': props['marker-width'],
    'marker-line-color': props['marker-line-color'],
    'marker-line-width': props['marker-line-width'],
    'marker-line-opacity': props['marker-line-opacity'],
    'marker-opacity': props['marker-opacity'],
    'marker-comp-op': 'multiply',
    'marker-type': 'ellipse',
    'marker-placement': 'point',
    'marker-allow-overlap': true,
    'marker-clip': false,
    'marker-multi-policy': 'largest'
  };

  var css = "\n#" + table_name +"{\n";

  _(carto_props).each(function(prop, name) {
    css += "  " + name + ": " + prop + "; \n";
  });

  css += "}";
  callback(css);

}

function bubble_generator(table, props, callback) {
  var table_name = table.get('name');
  var carto_props = {
   'marker-fill': props['marker-fill'],
   'marker-line-color': props['marker-line-color'],
   'marker-line-width': props['marker-line-width'],
   'marker-line-opacity': props['marker-line-opacity'],
   'marker-opacity': props['marker-opacity'],
   'marker-comp-op': props['marker-comp-op'],
   'marker-placement': 'point',
   'marker-type': 'ellipse',
   'marker-allow-overlap': true,
   'marker-clip':false,
   'marker-multi-policy':'largest'
  };
  var prop = props['property'];
  var min = props['radius_min'];
  var max = props['radius_max'];
  var fn = carto_functionMap[props['qfunction'] || DEFAULT_QFUNCTION];

  if(/none/i.test(props['marker-comp-op'])) {
    delete carto_props['marker-comp-op'];
  }
  var values = [];

  var NPOINS = 10;
  // TODO: make this related to the quartiles size
  // instead of linear. The circle area should be related
  // to the data and a little correction due to the problems
  // humans have to measure the area of a circle

  //calculate the bubles sizes
  for(var i = 0; i < NPOINS; ++i) {
    var t = i/(NPOINS-1);
    values.push(min + t*(max - min));
  }

  // generate carto
  simple_polygon_generator(table, carto_props, function(css) {
    table.originalData()[fn](NPOINS, prop, function(quartiles)  {
      for(var i = NPOINS - 1; i >= 0; --i) {
        if(quartiles[i] !== undefined && quartiles[i] != null) {
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
   'text-allow-overlap': true,
   'text-fill': props['text-fill']
  }

  if(props['polygon-comp-op'] && !/none/i.test(props['polygon-comp-op'])) {
    carto_props['polygon-comp-op'] = props['polygon-comp-op'];
  }
  if(props['line-comp-op'] && !/none/i.test(props['line-comp-op'])) {
    carto_props['line-comp-op'] = props['line-comp-op'];
  }
  if(props['marker-comp-op'] && !/none/i.test(props['marker-comp-op'])) {
    carto_props['marker-comp-op'] = props['marker-comp-op'];
  }

  var methodMap = {
    '3 Buckets': 3,
    '5 Buckets': 5,
    '7 Buckets': 7
  };


  if(!props['color_ramp']) {
    return;
  }

  var fn = carto_functionMap[props['qfunction'] || DEFAULT_QFUNCTION];
  var prop = props['property'];
  var nquartiles = methodMap[props['method']];
  var ramp = cdb.admin.color_ramps[props['color_ramp']][nquartiles];
  var table_name = table.get('name');

  if(!ramp) {
    cdb.log.error("no color ramp defined for " + nquartiles + " quartiles");
  }


  simple_polygon_generator(table, carto_props, function(css) {
    table.originalData()[fn](nquartiles, prop, function(quartiles)  {
      quartiles = normalizeQuartiles(quartiles);
      for(var i = nquartiles - 1; i >= 0; --i) {
        if(quartiles[i] !== undefined && quartiles[i] != null) {
          css += "\n#" + table_name +" [ " + prop + " <= " + quartiles[i] + "] {\n";

          if (type == "line") {
            css += "   line-color: " + ramp[i] + ";\n}"
          } else {
            css += "   polygon-fill: " + ramp[i] + ";\n}"
          }
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
   'polygon-comp-op': props['polygon-comp-op']
  }

  if(/none/i.test(props['polygon-comp-op'])) {
    delete carto_props['polygon-comp-op'];
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
    cdb.log.error("no color ramp defined for " + nquartiles + " quartiles");
  }

  carto_props['polygon-fill'] = ramp[ramp.length - 1];

  simple_polygon_generator(table, carto_props, function(css) {

    // density
    var tmpl = _.template("" +
    "WITH clusters as ( " +
    "SELECT  " +
        "cartodb_id,   " +
        "st_snaptogrid(the_geom_webmercator, <%= polygon_size %>*CDB_XYZ_Resolution(<%= z %>)) as center  " +
    "FROM <%= table_name %>" +
    "), " +
    "points as ( " +
        "SELECT  " +
            "count(cartodb_id) as npoints,  " +
            "count(cartodb_id)/power( <%= polygon_size %> * CDB_XYZ_Resolution(<%= z %>), 2 ) as density  " +
        "FROM  " +
            "clusters  " +
        "group by  " +
            "center " +
    "), " +
    "stats as ( " +
        "SELECT  " +
            "npoints,  " +
            "density,  " +
            "ntile(<%= slots %>) over (order by density) as quartile  " +
        "FROM points  " +
    ")  " +
    "SELECT  " +
        "quartile,  " +
        "max(npoints) as maxAmount,  " +
        "max(density) as maxDensity   " +
    "FROM stats  " +
    "GROUP BY quartile ORDER BY quartile ");

    var sql = tmpl({
        slots: nquartiles,
        table_name: table.get('name'),
        polygon_size: polygon_size,
        z: props.zoom
    });

    table.originalData()._sqlQuery(sql, function(data) {
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

      if (!this.table) {
        throw "table must be passed as param"
        return;
      }

      this.bind('change:properties', this._generateCarto, this);

      this.generators = {};
      this.registerGenerator('polygon',    simple_polygon_generator);
      this.registerGenerator('bubble',     bubble_generator);
      this.registerGenerator('intensity',  intensity_generator);
      this.registerGenerator('choropleth', choropleth_generator);
      this.registerGenerator('density',    density_generator); // the same generator than choroplet
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
      var typeMap = {
        'polygon': 'simple'
      }
      var t = this.get('type');
      t = typeMap[t] || t;
      var c = "/** " + t + " visualization */\n\n";
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
        }, { silence: true});
        self.change({ changes: {'style': ''}});

      })
    }

}, {
    DEFAULT_GEOMETRY_STYLE: "{\n // points\n [mapnik-geometry-type=point] {\n    marker-fill: #FF6600;\n    marker-opacity: 1;\n    marker-width: 12;\n    marker-line-color: white;\n    marker-line-width: 3;\n    marker-line-opacity: 0.9;\n    marker-placement: point;\n    marker-type: ellipse;marker-allow-overlap: true;\n  }\n\n //lines\n [mapnik-geometry-type=linestring] {\n    line-color: #FF6600; \n    line-width: 2; \n    line-opacity: 0.7;\n  }\n\n //polygons\n [mapnik-geometry-type=polygon] {\n    polygon-fill:#FF6600;\n    polygon-opacity: 0.7;\n    line-opacity:1;\n    line-color: #FFFFFF;\n   }\n }",
});


/**
 * this class provides methods to parse and extract information from the
 * cartocss like expressions used, filters, colors and errors
 */

cdb.admin.CartoParser = function(cartocss) {
  this.parse_env = null;
  this.ruleset = null;
  if(cartocss) {
    this.parse(cartocss);
  }
}

cdb.admin.CartoParser.prototype = {

  RESERVED_VARIABLES: ['mapnik-geometry-type', 'points_density'],

  parse: function(cartocss) {

    var parse_env = this.parse_env = {
      frames: [],
      errors: [],
      error: function(obj) {
        obj.line =  carto.Parser().extractErrorLine(cartocss, obj.index);
        this.errors.push(obj);
      }
    };

    var ruleset = null;
    try {
      ruleset = (new carto.Parser(parse_env)).parse(cartocss);
    } catch(e) {
      // add the style.mss string to match the response from the server
      this.parse_env.errors = this._parseError(["style\.mss" + e.message])
      return;
    }
    if(ruleset) {
      var defs = ruleset.toList(parse_env);
      for (var i in defs) {
        for (var j in defs[i].rules) {
          var r = defs[i].rules[j].eval(parse_env)
          if(r && r.toXML) {
            r.toXML(parse_env);
          }
        }
      }
    }
    this.ruleset = ruleset;
  },

  /**
   * gets an array of parse errors from windshaft
   * and returns an array of {line:1, error: 'string'] with user friendly
   * strings. Parses errors in format:
   *
   *  'style.mss:7:2 Invalid code: asdasdasda'
   */
  _parseError: function(errors) {
    var parsedErrors = [];
    for(var i in errors) {
      var err = errors[i];
      if(err && err.length > 0) {
        var g = err.match(/.*:(\d+):(\d+)\s*(.*)/);
        if(g) {
          parsedErrors.push({
            line: parseInt(g[1], 10),
            message: g[3]
          });
        } else {
          parsedErrors.push({
            line: null,
            message: err
          })
        }
      }
    }
    // sort by line
    parsedErrors.sort(function(a, b) { return a.line - b.line; });
    parsedErrors = _.uniq(parsedErrors, true, function(a) { return a.line + a.message; });
    return parsedErrors;
  },

  /**
   * return the error list, empty if there were no errors
   */
  errors: function() {
    return this.parse_env ? this.parse_env.errors : [];
  },

  _varsFromRule: function(rule) {
    function searchRecursiveByType(v, t) {
      var res = []
      for(var i in v) {
        if(v[i] instanceof t) {
          res.push(v[i]);
        } else if(typeof(v[i]) === 'object') {
          var r = searchRecursiveByType(v[i], t);
          if(r.length) {
            res = res.concat(r);
          }
        }
      }
      return res;
    }
    return searchRecursiveByType(rule, carto.tree.Field);
  },

  /**
   * return a list of variables used in cartocss
   */
  variablesUsed: function() {
    var columns = [];
    if(this.ruleset) {
      var definitions = this.ruleset.toList(this.parse_env);
      for (var d in definitions) {
        var def = definitions[d];
        if(def.filters) {
          // extract from rules
          for(var r in def.rules) {
            var rule = def.rules[r];
            columns = columns.concat(_.map(this._varsFromRule(rule), function(f) {
              return f.value;
            }));
          }

          // extract variables from filters
          for(var f in def.filters) {
            var filter = def.filters[f];
            if(filter.key) {
              columns.push(filter.key);
            }
          }
        }
      }
    }
    var self = this;
    return _.reject(_.uniq(columns), function(v) { 
      return _.contains(self.RESERVED_VARIABLES, v); 
    });
  }


}
