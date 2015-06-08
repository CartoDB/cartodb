
;(function() {

var root = this;

root.cartodb = root.cartodb || {};

var ramps = {
  green:  ['#EDF8FB', '#D7FAF4', '#CCECE6', '#66C2A4', '#41AE76', '#238B45', '#005824'],
  blue:  ['#FFFFCC', '#C7E9B4', '#7FCDBB', '#41B6C4', '#1D91C0', '#225EA8', '#0C2C84'],
  pink: ['#F1EEF6', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A', '#CE1256', '#91003F'],
  black:  ['#F7F7F7', '#D9D9D9', '#BDBDBD', '#969696', '#737373', '#525252', '#252525'],
  red:  ['#FFFFB2', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#B10026'],
  cat: ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#DDDDDD']
};

function geoAttr(geometryType) {
  return {
    "line": 'line-color',
    'polygon': "polygon-fill",
    'point': "marker-fill"
  }[geometryType]
}

var CSS = {
  choropleth: function(quartiles, prop, geometryType, ramp) {
    var attr = geoAttr(geometryType);
    var css = "#c{ " + attr + ": #0C2C84; line-color: #0C2C84; line-width: 0.1; line-opacity: 1; } "
    for(var i = quartiles.length - 1; i >= 0; --i) {
      if(quartiles[i] !== undefined && quartiles[i] != null) {
        css += "\n#c[ " + prop + " <= " + quartiles[i] + "] {\n";
        css += attr  + ":" + ramp[i] + ";\n}"
      }
    }
    return css;
  },

  category: function(cats, prop, geometryType) {
    var attr = geoAttr(geometryType);
    var ramp = ramps.cat;
    var css = "#c{ " + attr + ": #0C2C84; line-color: #0C2C84; line-width: 0.1; line-opacity: 1; } "
    for(var i = cats.length - 1; i >= 0; --i) {
      if(cats[i] !== undefined && cats[i] != null) {
        css += "\n#c[ " + prop + " = '" + cats[i] + "'] {\n";
        css += attr  + ":" + ramp[i] + ";\n}"
      }
    }
    return css;
  }

}

//function columnMap(sql, c, geometryType, bbox) {
  //s.describe(sql, c, function(data) {
    //guessMap(sql, geometryType, data.column, data, bbox);
  //});
//}

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
/*
CartoCSS.guess({
  user: '  '
  sql: '...'
  column:
})
*/

CSS.guess = guess;
CSS.guessCss = guessCss


root.cartodb.CartoCSS = CSS;

})();
