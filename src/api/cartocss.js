
;(function() {

var root = this;

root.cartodb = root.cartodb || {};

var ramps = {
  bool: [
    ['#5CA2D1', '#0F3B82', '#CCCCCC']
  ],
  green:  ['#EDF8FB', '#D7FAF4', '#CCECE6', '#66C2A4', '#41AE76', '#238B45', '#005824'],
  blue:  ['#FFFFCC', '#C7E9B4', '#7FCDBB', '#41B6C4', '#1D91C0', '#225EA8', '#0C2C84'],
  pink: ['#F1EEF6', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A', '#CE1256', '#91003F'],
  black:  ['#F7F7F7', '#D9D9D9', '#BDBDBD', '#969696', '#737373', '#525252', '#252525'],
  red:  ['#FFFFB2', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#B10026'],
  category: ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#DDDDDD'],
  divergent: ['#0080FF', '#40A0FF', '#7FBFFF', '#FFF2CC', '#FFA6A6', '#FF7A7A', '#FF4D4D']
};

function geoAttr(geometryType) {
  return {
    "line": 'line-color',
    'polygon': "polygon-fill",
    'point': "marker-fill"
  }[geometryType]
}

function getDefaultCSSForGeometryType(geometryType) {
  if (geometryType === "polygon") {
    return [
      "polygon-opacity: 0.7;",
      "line-color: #FFF;",
      "line-width: 0.5;",
      "line-opacity: 1;"
    ];
  }
  if (geometryType === "line") {
    return  [
      "line-width: 2;",
      "line-opacity: 0.7;"
    ];
  }
  return [
    "line-color: #0C2C84;",
    "line-opacity: 1;",
    "marker-fill-opacity: 0.9;",
    "marker-line-color: #FFF;",
    "marker-line-width: 1.5;",
    "marker-line-opacity: 1;",
    "marker-placement: point;",
    "marker-type: ellipse;",
    "marker-width: 10;",
    "marker-allow-overlap: true;"
  ];
}

var CSS = {
  choropleth: function(quartiles, tableName, prop, geometryType, ramp) {
    var attr = geoAttr(geometryType);
    var tableID = "#" + tableName;

    var defaultCSS = getDefaultCSSForGeometryType(geometryType);
    var css = "/** choropleth visualization */\n\n" + tableID + " {\n  " + attr + ": " + ramps.category[0] + ";\n" + defaultCSS.join("\n") + "\n}\n";

    for (var i = quartiles.length - 1; i >= 0; --i) {
      if (quartiles[i] !== undefined && quartiles[i] != null) {
        css += "\n" + tableID + "[" + prop + " <= " + quartiles[i] + "] {\n";
        css += "  " + attr  + ":" + ramp[i] + ";\n}"
      }
    }
    return css;
  },

  categoryMetadata: function(cats, options) {
    var metadata = [];

    var ramp = (options && options.ramp) ? options.ramp : ramps.category;
    var type = options && options.type ? options.type : "string";

    for (var i = cats.length - 1; i >= 0; --i) {
      var cat = cats[i];
      if (cat !== undefined && ((type === 'string' && cat != null) || (type !== 'string'))) {
        metadata.push({ title: cat, title_type: type, value_type: 'color', color: ramp[i] });
      }
    }

    return metadata;
  },

  category: function(cats, tableName, prop, geometryType, options) {
    var attr = geoAttr(geometryType);
    var tableID = "#" + tableName;
    var ramp = ramps.category;
    var name, value;

    var type = options && options.type ? options.type : "string";
    var ramp = (options && options.ramp) ? options.ramp : ramps.category;

    var defaultCSS = getDefaultCSSForGeometryType(geometryType);

    var css = "/** category visualization */\n\n" + tableID + " {\n  " + attr + ": " + ramp[0] + ";\n" + defaultCSS.join("\n") + "\n}\n";

    for (var i = cats.length - 1; i >= 0; --i) {

      var cat  = cats[i];

      if (type === 'string') {
        name = cat.replace(/\n/g,'\\n').replace(/\"/g, "\\\"");
        value = "\"" + name + "\"";
      } else {
        value = cat;
      }

      if (cat !== undefined && ((type === 'string' && cat != null) || (type !== 'string'))) {
        css += "\n" + tableID + "[" + prop + "=" + value + "] {\n";
        css += "  " + attr  + ":" + ramp[i] + ";\n}"
      }
    }

    return css;
  },

  torque: function(stats, tableName, options){
    var tableID = "#" + tableName;
    var ramp = ramps.category;
    var aggFunction = "count(cartodb_id)";
    var css = [
        '/** torque visualization */',
        'Map {',
        '  -torque-time-attribute: ' + stats.column + ';',
        '  -torque-aggregation-function: {{aggfunction}};',
        '  -torque-frame-count: ' + stats.steps + ';',
        '  -torque-animation-duration: 10;',
        '  -torque-resolution: 2',
        '}',
        tableID + " {",
        '  marker-width: 3;',
        '  marker-fill-opacity: 0.8;',
        '  marker-fill: #FEE391; ',
        '  comp-op: "lighten";',
        '  [value > 2] { marker-fill: #FEC44F; }',
        '  [value > 3] { marker-fill: #FE9929; }',
        '  [value > 4] { marker-fill: #EC7014; }',
        '  [value > 5] { marker-fill: #CC4C02; }',
        '  [value > 6] { marker-fill: #993404; }',
        '  [value > 7] { marker-fill: #662506; }',
        '  [frame-offset = 1] { marker-width: 10; marker-fill-opacity: 0.05;}',
        '  [frame-offset = 2] { marker-width: 15; marker-fill-opacity: 0.02;}',
        '}'
    ];
    if(options.torque.type === "category"){
      var hist = options.torque.dataColumn.get("stats").hist;
      for (var i = 0; i< hist.length; i++){
        css.push(tableID + '[' + options.torque.dataColumn.get("name") + "=" + hist[i][0] + "]{\n"
            + "marker-fill: " + ramp[i] + ";\n}");
      }
    }
    css = css.join('\n');

    if(options.torque.type === "category"){
      css.replace("{{aggfunction}}", "CDB_Math_Mode(torque_category)");
    } else if (options.torque.type === "value"){
      css.replace("{{aggfunction}}", options.torque.column.get("name"));
    }

    return css;

  },

  bubble: function(quartiles, tableName, prop, geometryType, ramp) {
    var css = "/** bubble visualization */\n" + getDefaultCSSForGeometryType("point").join('\n');

    var min = 10;
    var max = 30;

    var values = [];

    var NPOINS = 10;
    for(var i = 0; i < NPOINS; ++i) {
      var t = i/(NPOINS-1);
      values.push(min + t*(max - min));
    }

    // generate carto
    for(var i = NPOINS - 1; i >= 0; --i) {
      if(quartiles[i] !== undefined && quartiles[i] != null) {
        css += "\n#" + tableName +" [ " + prop + " <= " + quartiles[i] + "] {\n"
        css += "   marker-width: " + values[i].toFixed(1) + ";\n}"
      }
    }
    return css;
  }
}

function guessCss(sql, geometryType, column, stats) {
  var css = null
  if (stats.type === 'number') {
    css =  CSS.choropleth(stats.quantiles, column, geometryType, ramps.red);
  } else if(stats.type === 'string') {
    css = CSS.category(stats.hist.slice(0, ramps.cat.length).map(function(r) { return r[0]; }), column, geometryType)
  }
  return css;
}

function guess(o, callback) {
  if (!callback) throw new Error("no callback");
  var s = cartodb.SQL({ user: o.user });
  s.describe(o.sql, 'the_geom', function(data) {
    var geometryType = data.simplified_geometry_type;
    s.describe(o.sql, o.column, function(data) {
      callback(
        null, 
        guessCss(o.sql, geometryType, data.column, data)
      )
    });
  })
}

function guessMap(sql, tableName, column, stats, options) {
  var geometryType = column.get("geometry_type");
  var bbox =  column.get("bbox");
  var columnName = column.get("name");
  var visualizationType = "choropleth";
  var css = null
  var type = stats.type;
  var metadata = []
  var distinctPercentage = (stats.distinct / stats.count) * 100;

  if (stats.type === 'number') {

    if (stats.weight > 0.5 || distinctPercentage < 25) {

      if (distinctPercentage < 1) {
        visualizationType   = "category";
        var cats = stats.cat_hist.slice(0, ramps.category.length).map(function(r) { return r[0]; });
        css      = CSS.category(cats, tableName, columnName, geometryType, { type: stats.type });
        metadata = CSS.categoryMetadata(cats, { type: stats.type });

      } else if (geometryType === 'point'){
        visualizationType = "bubble";
        visFunction = CSS.bubble;
      } else {

        var visFunction = CSS.choropleth;
        if (['A','U'].indexOf(stats.dist_type) != -1) {
          // apply divergent scheme
          css = visFunction(stats.jenks, tableName, columnName, geometryType, ramps.divergent);
        } else if (stats.dist_type === 'F') {
          css = visFunction(stats.equalint, tableName, columnName, geometryType, ramps.red);
        } else {
          if (stats.dist_type === 'J') {
            css = visFunction(stats.headtails, tableName, columnName, geometryType, ramps.green);
          } else {
            var inverse_ramp = (_.clone(ramps.red)).reverse();
            css = visFunction(stats.headtails, tableName, columnName, geometryType, inverse_ramp);
          }
        }
      }
    }

  } else if (stats.type === 'string') {

    visualizationType   = "category";
    var cats = stats.hist.slice(0, ramps.category.length).map(function(r) { return r[0]; });
    css      = CSS.category(cats, tableName, columnName, geometryType);
    metadata = CSS.categoryMetadata(cats);

  } else if (stats.type === 'date') {
    visualizationType = "torque";
    css = CSS.torque(stats, tableName, options);

  } else if (stats.type === 'boolean') {
    visualizationType   = "category";
    var ramp = _.shuffle(ramps.bool)[0];
    var cats = ['true', 'false', null];
    var options = { type: stats.type, ramp: ramp };
    css      = CSS.category(cats, tableName, columnName, geometryType, options);
    metadata = CSS.categoryMetadata(cats, options);
  }

  var properties = {
    sql: sql, geometryType: geometryType, column: columnName, bbox: bbox, type: type, visualizationType: visualizationType
  };

  if (css) {
    properties.css = css;
  } else {
    properties.css = null;
    properties.weight = -100;
  }

  if (stats) {
    properties.stats = stats;
  }

  if (metadata) {
    properties.metadata = metadata;
  }

  return properties;
}

/*
CartoCSS.guess({
  user: '  '
  sql: '...'
  column:
})
*/

CSS.guess = guess;
CSS.guessCss = guessCss;
CSS.guessMap = guessMap;


root.cartodb.CartoCSS = CSS;

})();
