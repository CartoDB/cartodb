
;(function() {

var root = this;

root.cartodb = root.cartodb || {};

var ramps = {
  bool: ['#229A00', '#F84F40', '#DDDDDD'],
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
    "marker-line-width: 1;",
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

    for (var i = 0; i < cats.length; i++) {
      var cat = cats[i];
      if (i < 10 && cat !== undefined && ((type === 'string' && cat != null) || (type !== 'string'))) {
        metadata.push({ title: cat, title_type: type, value_type: 'color', color: ramp[i] });
      }
    }

    if (cats.length > 10) {
      metadata.push({ title: "Others", value_type: 'color', default: true, color: ramp[ramp.length - 1] });
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

    for (var i = 0; i < cats.length; i++) {

      var cat = cats[i];

      if (type === 'string') {
        name = cat.replace(/\n/g,'\\n').replace(/\"/g, "\\\"");
        value = "\"" + name + "\"";
      } else {
        value = cat;
      }

      if (i < 10 && cat !== undefined && ((type === 'string' && cat != null) || (type !== 'string'))) {
        css += "\n" + tableID + "[" + prop + "=" + value + "] {\n";
        css += "  " + attr  + ":" + ramp[i] + ";\n}"
      }
    }

    if (cats.length > 10) {
      css += "\n" + tableID + "{\n";
      css += "  " + attr  + ": " + ramp[ramp.length - 1]+ ";\n}"
    }

    return css;
  },

  torque: function(stats, tableName, options){
    var tableID = "#" + tableName;
    var aggFunction = "count(cartodb_id)";
    var css = [
        '/** torque visualization */',
        'Map {',
        '  -torque-time-attribute: ' + stats.column + ';',
        '  -torque-aggregation-function: "count(cartodb_id)";',
        '  -torque-frame-count: ' + stats.steps + ';',
        '  -torque-animation-duration: 10;',
        '  -torque-resolution: 2;',
        '}',
        tableID + " {",
        '  marker-width: 3;',
        '  marker-fill-opacity: 0.8;',
        '  marker-fill: #0F3B82; ',
        '  comp-op: "lighten"; ',
        '  [frame-offset = 1] { marker-width: 10; marker-fill-opacity: 0.05;}',
        '  [frame-offset = 2] { marker-width: 15; marker-fill-opacity: 0.02;}',
        '}'
    ];
    css = css.join('\n');

    return css;

  },

  bubble: function(quartiles, tableName, prop) {
    var tableID = "#" + tableName;
    var css = "/** bubble visualization */\n\n" + tableID + " {\n";
    css += getDefaultCSSForGeometryType("point").join('\n');
    css += "\nmarker-fill: #FF5C00;";
    css += "\n}\n\n";

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
  },

  heatmap: function(stats, tableName, options){
    var tableID = "#" + tableName;
    var css = [
        '/** heatmap visualization */',
        'Map {',
        '  -torque-time-attribute: "cartodb_id";',
        '  -torque-aggregation-function: "count(cartodb_id)";',
        '  -torque-frame-count: 1;',
        '  -torque-animation-duration: 10;',
        '  -torque-resolution: 2;',
        '}',
        tableID + " {",
        '  marker-width: 10;',
        '  marker-fill-opacity: 0.4;',
        '  marker-fill: #0F3B82; ',
        '  comp-op: "lighten"; ',
        '  image-filters: colorize-alpha(blue, cyan, lightgreen, yellow , orange, red);',
        '  marker-file: url(http://s3.amazonaws.com/com.cartodb.assets.static/alphamarker.png);',
        '}'
    ];
    css = css.join('\n');
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

function getWeightFromShape(dist_type){
  return {
    U: 0.9,
    A: 0.9,
    L: 0.7,
    J: 0.7,
    S: 0.5,
    F: 0.3
  }[dist_type];
}

function getMethodProperties(stats) {

  var method;
  var ramp = ramps.pink;
  var name = "pink";

  if (['A','U'].indexOf(stats.dist_type) != -1) { // apply divergent scheme
    method = stats.jenks;

    if (stats.min < 0 && stats.max > 0){
      ramp = ramps.divergent;
      name = "spectrum2";
    }

  } else if (stats.dist_type === 'F') {
    method = stats.equalint;
    ramp = ramps.red;
    name = "red";
  } else {
    if (stats.dist_type === 'J') {
      method = stats.headtails;
      ramp = ramps.blue;
      name = "blue";
    } else {
      //ramp = (_.clone(ramps.red)).reverse();
      method = stats.headtails;
      ramp = ramps.red;
      name = "red";
    }
  }

  return { name: name, ramp: ramp, method: method };

}

function guessMap(sql, tableName, column, stats) {
  var geometryType = column.get("geometry_type");
  var columnName = column.get("column");
  var visualizationType = "choropleth";
  var css = null
  var type = stats.type;
  var metadata = []
  var distinctPercentage = (stats.distinct / stats.count) * 100;

  if (type === 'number') {

    var calc_weight = (stats.weight + getWeightFromShape(stats.dist_type)) / 2;

    if (calc_weight >= 0.5) {

      var visFunction = CSS.choropleth;
      var properties = getMethodProperties(stats);

      if (stats.count < 200 && geometryType === 'point'){
        visualizationType = "bubble";
        visFunction = CSS.bubble;
      }

      css = visFunction(properties.method, tableName, columnName, geometryType, properties.ramp);

    } else if (stats.weight > 0.5 || distinctPercentage < 25) {

      if (distinctPercentage < 1) {
        visualizationType   = "category";

        var cats = stats.cat_hist;
        cats = _.sortBy(cats, function(cat) { return cat[1]; }).reverse().slice(0, ramps.category.length);
        cats = _.sortBy(cats, function(cat) { return cat[0]; });
        cats = cats.map(function(r) { return r[0]; });

        css      = CSS.category(cats, tableName, columnName, geometryType, { type: type });
        metadata = CSS.categoryMetadata(cats, { type: type });

      } else if (distinctPercentage >=1) {

        var visFunction = CSS.choropleth;

        if (geometryType === 'point'){
          visualizationType = "bubble";
          visFunction = CSS.bubble;
        }

        var properties = getMethodProperties(stats);
        css = visFunction(properties.method, tableName, columnName, geometryType, properties.ramp);
      }
    }

  } else if (type === 'string') {

    visualizationType   = "category";

    var cats = stats.hist;
    cats = _.sortBy(cats, function(cat) { return cat[1]; }).reverse().slice(0, ramps.category.length);
    cats = _.sortBy(cats, function(cat) { return cat[0]; });
    cats = cats.map(function(r) { return r[0]; });

    css      = CSS.category(cats, tableName, columnName, geometryType);
    metadata = CSS.categoryMetadata(cats);


  } else if (type === 'date') {
    visualizationType = "torque";
    css = CSS.torque(stats, tableName);

  } else if (type === 'boolean') {
    visualizationType  = "category";
    var ramp = ramps.bool;
    var cats = ['true', 'false', null];
    var options = { type: type, ramp: ramp };
    css      = CSS.category(cats, tableName, columnName, geometryType, options);
    metadata = CSS.categoryMetadata(cats, options);
  } else if (stats.type === 'geom') {
    visualizationType = "heatmap";
    css = CSS.heatmap(stats, tableName, options);
  }

  var properties = {
    sql: sql,
    geometryType: geometryType,
    column: columnName,
    bbox: column.get("bbox"),
    type: type,
    visualizationType: visualizationType
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
CSS.getWeightFromShape = getWeightFromShape;
CSS.getMethodProperties = getMethodProperties;


root.cartodb.CartoCSS = CSS;

})();
