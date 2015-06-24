var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

module.exports = BaseDialog.extend({

  options: {
    ramps: {
      green: ['#EDF8FB', '#D7FAF4', '#CCECE6', '#66C2A4', '#41AE76', '#238B45', '#005824'],
      blue:  ['#FFFFCC', '#C7E9B4', '#7FCDBB', '#41B6C4', '#1D91C0', '#225EA8', '#0C2C84'],
      pink:  ['#F1EEF6', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A', '#CE1256', '#91003F'],
      black: ['#F7F7F7', '#D9D9D9', '#BDBDBD', '#969696', '#737373', '#525252', '#252525'],
      red:   ['#FFFFB2', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#B10026'],
      cat:   ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#DDDDDD'],
      divergent: ['rgb(215,48,39)','rgb(252,141,89)','rgb(254,224,144)','rgb(255,255,191)','rgb(224,243,248)','rgb(145,191,219)','rgb(69,117,180)']
    }
  },

  initialize: function() {
    this.elder('initialize');

    if (!this.options.table) {
      throw new Error('table is required');
    }

    this._initViews();
    this._initBinds();
  },

  render_content: function() {
    return this._panes.getActivePane().render().el;
  },

  _initViews: function() {

    _.bindAll(this, "guessMap");

    this.table = this.options.table;

    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);
    this._panes.addTab('confirm',
      ViewFactory.createByTemplate('common/dialogs/pecan/template', {
      })
    );
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Deleting row…',
        quote: randomQuote()
      })
    );
    this._panes.addTab('fail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Could not delete row for some reason'
      })
    );
    this._panes.active('confirm');
    this._start();
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
  },

  ok: function() {
  },

  geoAttr: function(geometryType) {
    return {
      "line": 'line-color',
      'polygon': "polygon-fill",
      'point': "marker-fill"
    }[geometryType]
  },

  choropleth: function(quartiles, prop, geometryType, ramp) {
    var attr = this.geoAttr(geometryType);
    var css = "#c{ " + attr + ": #0C2C84; polygon-opacity: 0.6; line-color: #0C2C84; line-width: 0.0; line-opacity: 1; } "
    for(var i = quartiles.length - 1; i >= 0; --i) {
      if(quartiles[i] !== undefined && quartiles[i] != null) {
        css += "\n#c[ " + prop + " <= " + quartiles[i] + "] {\n";
        css += attr  + ":" + ramp[i] + ";\n}"
      }
    }
    return css;
  },

  category: function(cats, prop, geometryType) {
    var attr = this.geoAttr(geometryType);
    var ramp = this.options.ramps.cat;
    var css = "#c{ " + attr + ": #0C2C84; polygon-opacity: 0.6; line-color: #0C2C84; line-width: 0.0; line-opacity: 1; } "
    for(var i = cats.length - 1; i >= 0; --i) {
      if(cats[i] !== undefined && cats[i] != null) {
        css += "\n#c[ " + prop + " = '" + cats[i] + "'] {\n";
        css += attr  + ":" + ramp[i] + ";\n}"
      }
    }
    return css;
  },

   makeMap: function(div, sql, cartocss, bbox) {
    // create leaflet map
    var map = L.map(div, { 
      zoomControl: false,
      center: [43, 0],
      zoom: 3,
      scrollWheelZoom: false
    })

    map.fitBounds(bbox);

    // add a base layer
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }).addTo(map);

    // add cartodb layer with one sublayer
    cartodb.createLayer(map, {
      user_name: account,
      type: 'cartodb',
      sublayers: [{ sql: sql, cartocss: cartocss }]
    })
    .addTo(map)
  },

  guessMap: function(sql, geometryType, column, stats, bbox) {
    var css = null
    var mssg = "";
    // these columns made the cut in an analysis in python
    // code here: http://nbviewer.ipython.org/gist/ohasselblad/b2475c95a23c5e070264
    var make_the_cut = ['areasource', 'bsmtcode', 'builtcode', 'irrlotcode', 'ownertype', 'plutomapid', 'proxcode', 'schooldist', 'splitzone'];
    cut = false

    if (stats.type == 'number') {
      if (['A','U'].indexOf(stats.dist_type) != -1) {
        // apply divergent scheme
        css = this.choropleth(stats.quantiles, column, geometryType, this.options.ramps.divergent);
      } else if (stats.dist_type === 'F') {
        css = this.choropleth(stats.equalint, column, geometryType, this.options.ramps.blue);
      } else {
        if (stats.dist_type === 'J') {
          css =  this.choropleth(stats.quantiles, column, geometryType, this.options.ramps.blue);
        } else {
          var inverse_ramp = (_.clone(this.options.ramps.blue)).reverse();
          css =  this.choropleth(stats.quantiles, column, geometryType, inverse_ramp);
        }
      }
      mssg = '<span style="font-weight: bold; text-decoration: underline;">' + column + "</span><br /> std: " + stats.stddev + "<br /> avg: " + stats.avg + " <br /> dist type: " + stats.dist_type;
    } else if(stats.type == 'string') {
      if (make_the_cut.indexOf(column) != -1) {
        cut = true
        mssg = column + "PASSES :) -- (#uniques: " + stats.distinct + " null%: " + stats.count_nulls + ")";
      } else {
        cut = false
        mssg = column + "DOESN'T PASS -- (#uniques: " + stats.distinct + " null%: " + stats.count_nulls + ")";
      }
      css = this.category(stats.hist.slice(0, this.options.ramps.cat.length).map(function(r) { return r[0]; }), column, geometryType)
    }

      //console.log(mssg)
    if (css) {
      if (cut) {
        var layer_definition = {
          user_name: user_data.username,
          //tiler_domain: "localhost.lan",
          //tiler_port: "8181",
          //tiler_protocol: "http",
          layers: [{
            type: "http",
            options: {
              urlTemplate: "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
              subdomains: [ "a", "b", "c" ]
            }
          }, {
            type: "cartodb",
            options: {
              sql: sql,
              cartocss: css,
              cartocss_version: "2.1.1"
            }
          }]
        };

        cdb.Image(layer_definition).size(520, 520).zoom(this.options.map.get("zoom")).center(this.options.map.get("center")).getUrl(function(error, url) {
          console.log(url)
        });
      }

      //var div = $('<div>')
      //div.attr('class', 'map');
      //$('body').append(div);
      //makeMap(div[0], sql, css, bbox);
      //div.append($('<div>').html(mssg).attr('class', 'lengend'));
    }
  },

  columnMap: function(sql, c, geometryType, bbox) {
    var self = this;
    this.s.describe(sql, c, function(data) {
      if (data.type === 'number') {
        console.log(data.column, 'avg:',data.avg);
      } else if (data.type === 'string') {
        console.log(data.column, 'uniques:',data.distinct);
      } else {
        console.log(data.column, 'type: ' + data.type);
      }
      self.guessMap(sql, geometryType, data.column, data, bbox);
    });
  },

  _start: function() {
    var self = this;
    var sql = 'select * from ' + this.table.id;
    this.s = cdb.admin.SQL();
    this.s.describe(sql, 'the_geom', function(data) {
      var geometryType = data.simplified_geometry_type;
      self.s.columns(sql, function(columns) {
        _(columns).each(function(v, k) {
          self.columnMap(sql, k.concat(""), geometryType, data.bbox);
        })
      });
    })
  }



});
