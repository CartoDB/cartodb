
;(function() {

var root = this;

root.cartodb = root.cartodb || {};

var ramps = {
  green:  ['#EDF8FB', '#D7FAF4', '#CCECE6', '#66C2A4', '#41AE76', '#238B45', '#005824'],
  blue:  ['#FFFFCC', '#C7E9B4', '#7FCDBB', '#41B6C4', '#1D91C0', '#225EA8', '#0C2C84'],
  pink: ['#F1EEF6', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A', '#CE1256', '#91003F'],
  black:  ['#F7F7F7', '#D9D9D9', '#BDBDBD', '#969696', '#737373', '#525252', '#252525'],
  red:  ['#FFFFB2', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#B10026'],
  category: ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#DDDDDD']
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

  categoryMetadata: function(cats, prop, geometryType) {
    var metadata = [];

    for (var i = cats.length - 1; i >= 0; --i) {
      if (cats[i] !== undefined && cats[i] != null) {
        metadata.push({ title: cats[i], title_type: "string", value_type: 'color', color: ramps.category[i] });
      }
    }

    return metadata;
  },

  category: function(cats, tableName, prop, geometryType) {
    var attr = geoAttr(geometryType);
    var tableID = "#" + tableName;
    var ramp = ramps.category;

    var defaultCSS = getDefaultCSSForGeometryType(geometryType);

    var css = "/** category visualization */\n\n" + tableID + " {\n  " + attr + ": " + ramps.category[0] + ";\n" + defaultCSS.join("\n") + "\n}\n";

    for (var i = cats.length - 1; i >= 0; --i) {
      if (cats[i] !== undefined && cats[i] != null) {
        css += "\n" + tableID + "[" + prop + " = '" + cats[i] + "'] {\n";
        css += "  " + attr  + ":" + ramp[i] + ";\n}"
      }
    }
    return css;
  }
}

function guessCss(sql, geometryType, column, stats) {
  var css = null
  if (stats.type == 'number') {
    css =  CSS.choropleth(stats.quantiles, column, geometryType, ramps.blue);
  } else if(stats.type == 'string') {
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

function guessMap(sql, tableName, column, stats) {
  var geometryType = column.get("geometry_type");
    var bbox =  column.get("bbox");
    var columnName = column.get("name");
    var wizard = "choropleth";
    var css = null
    var type = stats.type;
    var metadata = []

  if (stats.type == 'number') {
    if (['A','U'].indexOf(stats.dist_type) != -1) {
      // apply divergent scheme
      css = CSS.choropleth(stats.jenks, tableName, columnName, geometryType, ramps.divergent);
    } else if (stats.dist_type === 'F') {
      css = CSS.choropleth(stats.equalint, tableName, columnName, geometryType, ramps.blue);
    } else {
      if (stats.dist_type === 'J') {
        css = CSS.choropleth(stats.headtails, tableName, columnName, geometryType, ramps.blue);
      } else {
        var inverse_ramp = (_.clone(ramps.blue)).reverse();
        css = CSS.choropleth(stats.headtails, tableName, columnName, geometryType, inverse_ramp);
      }
    }
  
  } else if (stats.type == 'string') {

      wizard   = "category";
      css      = CSS.category(stats.hist.slice(0, ramps.category.length).map(function(r) { return r[0]; }),tableName, columnName, geometryType);
      metadata = CSS.categoryMetadata(stats.hist.slice(0, ramps.category.length).map(function(r) { return r[0]; }),tableName, columnName, geometryType);

    }

  if (css) {
    return { sql: sql, css: css, metadata: metadata, column: columnName, bbox: bbox, stats: stats, type: type, wizard: wizard  };
  } else {
    return { sql: sql, css: null, metadata: metadata, column: columnName, bbox: bbox, weight: -100, type: type, wizard: wizard };
  }
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
