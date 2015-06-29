var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

module.exports = BaseDialog.extend({

  _TABS_PER_ROW: 3,

  events: cdb.core.View.extendEvents({
    "click .js-goPrev": "_prevPage",
    "click .js-goNext": "_nextPage",
    "click .js-skip"  : "_onSkipClick"
  }),

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

    this.model = new cdb.core.Model({ page: 1, maxPages: 0 });
    this.model.bind('change:page', this._moveTabsNavigation, this);

    this._initViews();
    this._initBinds();
  },

  render_content: function() {
    return this._panes.getActivePane().render().el;
  },

  render: function() {
    BaseDialog.prototype.render.apply(this, arguments);
    return this;
  },

  _initViews: function() {

    _.bindAll(this, "_guessMap", "_generateThumbnail", "_analyzeColumn", "_analyzeColumns", "_refreshMapList");

    this.table = this.options.table;

    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });

    this.addView(this._panes);
    this._panes.addTab('vis',
      ViewFactory.createByTemplate('common/dialogs/pecan/template', {
      })
    );
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Analyzing your data…',
        quote: randomQuote()
      })
    );
    this._panes.addTab('fail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Could not delete row for some reason'
      })
    );

    //this._panes.active('vis');

    this.render();
    this._panes.active('loading');

    this._start();
  },

  _nextPage: function() {
    var page = this.model.get('page');
    var maxPages = this.model.get('maxPages');

    if (page < maxPages) {
      this.model.set('page', page + 1);
    }
  },

  _prevPage: function() {
    var page = this.model.get('page');
    if (page > 1) {
      this.model.set('page', page - 1);
    }
  },

  _moveTabsNavigation: function() {
    var page = this.model.get('page');
    var rowWidth = 990;

    var p = rowWidth * (page - 1);
    this.$('.js-map-list').css('margin-left', '-' + p + 'px');
    this._refreshNavigation();
  },

  _refreshNavigation: function() {
    var page = this.model.get('page');
    var maxPages = this.model.get('maxPages');

    this.$('.js-goPrev')[ page > 1 ? 'removeClass' : 'addClass' ]('is-disabled');
    this.$('.js-goNext')[ page < maxPages ? 'removeClass' : 'addClass' ]('is-disabled');
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
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

      _guessMap: function(sql, geometryType, column, stats, bbox) {
        var wizard = "choropleth";
        var css = null
        var mssg = "";
        var type = stats.type;

        if (stats.type == 'number') {
          if (['A','U'].indexOf(stats.dist_type) != -1) {
            // apply divergent scheme
            css = this.choropleth(stats.jenks, column, geometryType, this.options.ramps.divergent);
          } else if (stats.dist_type === 'F') {
            css = this.choropleth(stats.equalint, column, geometryType, this.options.ramps.blue);
          } else {
              if (stats.dist_type === 'J') {
                css =  this.choropleth(stats.headtails, column, geometryType, this.options.ramps.blue);
              } else {
                var inverse_ramp = (_.clone(this.options.ramps.blue)).reverse();
                css =  this.choropleth(stats.headtails, column, geometryType, inverse_ramp);
              }
          }
          
          mssg = '<span style="font-weight: bold; text-decoration: underline;">' + column + '</span>'
              + '<br /> std: ' + stats.stddev 
              + '<br /> avg: ' + stats.avg 
              + '<br /> num unique: ' + stats.distinct
              + '<br /> lstddev: ' + stats.lstddev
              + '<br /> count: ' + stats.count
              + '<br /> num nulls: ' + stats.null_ratio
              + '<br /> dist type: ' + stats.dist_type 
              + '<br /> weight: ' + stats.weight;
        
        } else if (stats.type == 'string') {
        
          mssg = '<span style="font-weight: bold; text-decoration: underline;">' + column + '</span>'
                + '<br />#uniques: ' + stats.distinct
                + '<br />null%: ' + stats.null_ratio
                + '<br />count: ' + stats.count
                + '<br />% in first 10 columns: ' + stats.skew
                + '<br />overall weight: ' +  stats.weight;
                wizard = "category";
                css = this.category(stats.hist.slice(0, this.options.ramps.cat.length).map(function(r) { return r[0]; }), column, geometryType);
        }

        if (css) {
          return {sql: sql, css: css, bbox: bbox, weight: stats.weight, type: type, mssg: mssg, wizard: wizard };
        } else {
          return {sql: sql, css: null, bbox: bbox, weight: -100, type: type, mssg: mssg, wizard: wizard};
        }
      },


  _generateThumbnail: function(column, callback) {
    var layer_definition = {
      user_name: user_data.username,
      tiler_domain: "localhost.lan",
      tiler_port: "8181",
      tiler_protocol: "http",
      layers: [{
        type: "http",
        options: {
          urlTemplate: "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          subdomains: [ "a", "b", "c" ]
        }
      }, {
        type: "cartodb",
        options: {
          sql: column.get("sql"),
          cartocss: column.get("css"),
          cartocss_version: "2.1.1"
        }
      }]
    };

    cdb.Image(layer_definition).size(288, 170).zoom(this.options.map.get("zoom")).center(this.options.map.get("center")).getUrl(function(error, url) {
      callback && callback(error, url);
    });

  },

  _analyzeColumn: function(column) {

    //sql, c, geometryType, bbox
    //this._columnMap(sql, column.get("type"), column.get("geometry_type"), column.get("bbox"));

    var self = this;

    this.sql.describe(this.query, column.get("name"), function(data) {

      var response = self._guessMap(self.query, column.get("geometry_type"), data.column, data, column.get("bbox"));

      if (response) {
        column.set({ analyzed: true, sql: response.sql, css: response.css, wizard: response.wizard });
      } else {
        column.set({ analyzed: true });
      }

      if (response) {

        self._generateThumbnail(column, function(error, url) {

          if (!error) {
            self._panes.active('vis');

            var $el = $(cdb.templates.getTemplate('common/dialogs/pecan/card')({
              column: data.column,
              wizard: response.wizard,
              src: url
            }));

            var img = new Image();

            img.onerror = function() {
              console.log(error);
            };

            img.onload  = function() {
              $el.find(".js-loader").hide();
              $el.find("img").show();
            };

            img.src = url;

            self.$(".js-map-list").append($el);

            $el.on("click", function(e) {
              self.killEvent(e);
              self._onCardClick(response);
            });

            self._refreshMapList($el);
            self._refreshNavigation();
          }
        });

      }
    });
  },

  _refreshMapList: function($el) {
    var w = $el.width();
    var l = this.$(".js-card").length;
    this.$(".PecanMap-MapsList").width(w * l + (l - 1) * 30);
    this.model.set('maxPages', Math.ceil(this.$('.MapsList-item').size() / this._TABS_PER_ROW));
  },

  _getAnalyzedColumns: function() {
    return this.columns.filter(function(c) { return c.get("analyzed")})
  },

  _start: function() {
    var self = this;

    this.query = 'SELECT * FROM ' + this.table.id;

    this.sql = cdb.admin.SQL();

    this.columns = new Backbone.Collection();

    //this.columns.bind("change:analyzed", function(column) {
      //var analyzed = this._getAnalyzedColumns();
    //}, this);

    this.sql.describe(this.query, 'the_geom', function(data) {

      var geometryType = data.simplified_geometry_type;

      self.sql.columns(self.query, function(columns) {

        _(columns).each(function(type, name) {
          this.columns.add({ name: name.concat(""), type: type, geometry_type: geometryType, bbox: data.bbox, analyzed: false })
        }, self);

        self._analyzeColumns();

      });

    });

  },

  _onCardClick: function(response) {
    var dataLayers = this.options.map.layers.getDataLayers();
    if (dataLayers[0]) {
      dataLayers[0].save({ tile_style_custom: true, tile_style: response.css, query: response.sql });
    }
    this.close();
  },

  _onSkipClick: function(e) {
    this.killEvent(e);
    this.close();
    this.trigger("skip", this);
  },

  _analyzeColumns: function() {
    this.columns.each(this._analyzeColumn);
  },

  _keydown: function(e) {
    if (e.keyCode === 37) {
      this._prevPage();
    } else if (e.keyCode === 39) {
      this._nextPage();
    }
    cdb.admin.BaseDialog.prototype._keydown.call(this, e);
  }

});
