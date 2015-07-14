var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

module.exports = BaseDialog.extend({

  _CARD_WIDTH: 288,
  _CARD_HEIGHT: 170,
  _TABS_PER_ROW: 3,
  _MAX_ROWS: 100000,
  _MAX_COLS: 60,
  _REJECT: 0,
  _KEEP: 1,
  _GET_BBOX_FROM_THE_GEOM: true,
  _EXCLUDED_COLUMNS: ['cartodb_id', 'the_geom', 'lat', 'lon', 'lng', 'long', 'latitude', 'longitude', 'shape_length', 'shape_area', 'objectid', 'id', 'country', 'state', 'created_at', 'updated_at', 'iso2', 'iso3', 'x_coord', 'y_coord', 'xcoord', 'ycoord'],

  events: cdb.core.View.extendEvents({
    "click .js-goPrev": "_prevPage",
    "click .js-goNext": "_nextPage",
    "click .js-skip"  : "_onSkipClick"
  }),

  initialize: function() {
    this.elder('initialize');

    if (!this.options.vis) {
      throw new Error('vis is required');
    }

    if (!this.options.user) {
      throw new Error('user is required');
    }

    this._initModels();
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

  _initModels: function() {
    this.columns = new Backbone.Collection();
    this.model = new cdb.core.Model({ page: 1, maxPages: 0 });
  },

  _initViews: function() {

    _.bindAll(this, "_addCard", "_generateThumbnail", "_refreshMapList", "_onLoadWizard");

    this.vis   = this.options.vis;
    this.map   = this.vis.map;
    this.table = this.vis.map.table;
    this.user  = this.options.user;

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

    this._panes.addTab('applying',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Applying style…',
        quote: randomQuote()
      })
    );

    this._panes.active('loading');

    var self = this;
    this.options.collection.each(function(column) {

      if (column.get("success")) {
        this._generateThumbnail(column, function(error, url) {
          if (!error) {
            self._addCard(url, column);
          }
        });
      }

    }, this);

  },

  _initBinds: function() {
    this.model.bind('change:page', this._moveTabsNavigation, this);
    this.columns.bind('change:analyzed', this._onAnalyzeColumn, this);
    this._panes.bind('tabEnabled', this.render, this);
  },

  _onSkipClick: function(e) {
    this.killEvent(e);
    this.model.set("disabled", true);
    this.close(); // TODO: trigger a skip after the manual testing is finished
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

  _hideNavigation: function() {
    this.$('.js-navigation').addClass("is-hidden");
  },

  _generateLayerDefinition: function(type, sql, css) {
    var template = this.map.getLayerAt(0).get("urlTemplate");
    var api_key  = this.user.get("api_key");
    var maps_api_template = cdb.config.get('maps_api_template');

    var layerDefinition = {
      user_name: user_data.username,
      maps_api_template: maps_api_template,
      api_key: api_key,
      layers: [{
        type: "http",
        options: {
          urlTemplate: template,
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

    if (type === "torque"){
      layerDefinition.layers[1] = {
        type: "torque",
        options: {
          sql: sql,
          cartocss: css,
          cartocss_version: "2.1.1"
        }
      }
    }

    return layerDefinition;
  },

  _generateThumbnail: function(column, callback) {

    var layerDefinition = this._generateLayerDefinition(column.get("visualizationType"), column.get("sql"), column.get("css"));

    var onImageReady = function(error, url) {
      callback && callback(error, url);
    };

    var bbox = this.collection.at(0).get("bbox");
    if (bbox) {
      cdb.Image(layerDefinition).size(this._CARD_WIDTH, this._CARD_HEIGHT).bbox(bbox).getUrl(onImageReady);
    } else {
      cdb.Image(layerDefinition).size(this._CARD_WIDTH, this._CARD_HEIGHT).zoom(this.map.get("zoom")).center(this.map.get("center")).getUrl(onImageReady);
    }

  },

  _addCard: function(url, column) {
    var self = this;

    var src = url + "?api_key=" + this.user.get("api_key");

    var wizardName = column.get("visualizationType").charAt(0).toUpperCase() + column.get("visualizationType").slice(1);

    var null_count = +(column.get("null_ratio") * column.get("count")).toFixed(2);
    var prettyNullCount = Utils.formatNumber(null_count);

    var $el = $(cdb.templates.getTemplate('common/dialogs/pecan/card')({
      column: column.get("column"),
      wizard: wizardName,
      metadata: column.get("metadata"),
      null_count: prettyNullCount,
      weight: column.get("weight")
    }));

    if (wizardName === "Choropleth") {
      this._addHistogram($el.find(".js-graph"), column);
    }

    var img = new Image();

    img.onerror = function() {
      console.log("error loading the image for " + column.get("column"));
    };

    img.onload  = function() {
      $el.find(".js-loader").hide();
      $el.find(".js-header").append('<img class="MapCard-preview" src="' + src + '" />');
      $el.find("img").show();
    };

    img.src = src;

    this._panes.active('vis');

    if (this._getSuccessColumns().length < 3) {
      this.$(".js-map-list").addClass("is--centered");
    }

    if (wizardName === 'Torque') {
      this.$(".js-map-list").prepend($el);
    } else {
      this.$(".js-map-list").append($el);
    }

    $el.on("click", function(e) {
      self.killEvent(e);
      self.model.set("column", column);
      self._onCardClick();
    });

    this._refreshMapList($el);
    this._refreshNavigation();
  },

  _refreshMapList: function($el) {
    var w = $el.width();
    var l = this.$(".js-card").length;
    this.$(".js-map-list").width(w * l + (l - 1) * 30);
    this.model.set('maxPages', Math.ceil(this.$('.js-card').size() / this._TABS_PER_ROW));
  },

  _getSuccessColumns: function() {
    return this.columns.filter(function(c) { return c.get("success")});
  },

  _onCardClick: function() {
    this.layer = this._getDataLayer();

    this._bindDataLayer();

    var properties = this.layer.wizard_properties.propertiesFromStyle(this.model.get("column").css);

    var wizard = this.model.get("column").get("visualizationType");

    this.layer.wizard_properties.active(wizard, properties);

    this._panes.active('applying');

    console.log("%cApplying wizard: " + wizard, "font-weight: bold; color:brown;");
  },

  _getDataLayer: function() {
    return this.map.layers.getDataLayers()[0];
  },

  _bindDataLayer: function() {
    this.layer.wizard_properties.unbind("load", this._onLoadWizard, this);
    this.layer.wizard_properties.bind("load", this._onLoadWizard, this);
  },

  _onLoadWizard: function() {

    var column = this.model.get("column");
    var property = column.get("column");
    var wizard   = column.get("visualizationType");

    var properties = { property: property };

    if (wizard === "category") {
      this._getCategoriesProperties(properties);
    } else if (wizard == 'choropleth') {
      this._getChoroplethProperties(properties);
    }

    this.layer.wizard_properties.set(properties);
    this.close(); // TODO: trigger a skip after the manual testing is finished
  },

  _getChoroplethProperties: function(properties) {
    var column = this.model.get("column");

    var property = column.get("column");
    var type     = column.get("type");
    var dist     = column.get("dist_type");;

    properties.qfunction  = this._getQFunction(dist);
    properties.color_ramp = this._getRamp(dist);

    console.log("%cApplying: " + properties.color_ramp +  " and " +  properties.qfunction + " to " + property + " (" + dist + ")", 'color: blue; ' );
    return properties;
  },

  _getCategoriesProperties: function(properties) {
    var column = this.model.get("column");
    properties.metadata = column.get("metadata");;
    return properties;
  },

  _getQFunction: function(dist) {
    var qfunction = "Jenks";

    if (dist === 'L' || dist == 'J') {
      qfunction = "Heads/Tails";
    } else if (dist === 'A' || dist == 'U') {
      qfunction = "Jenks";
    } else if (dist === 'F') {
      qfunction = "Quantile"; // we could use 'Equal Interval' too
    }
    return qfunction;
  },

  _getRamp: function(dist) {
    var ramp = "inverted_red";

    if (dist === 'A' || dist === 'U') {
      ramp = "spectrum2";
    } else if (dist === 'F') {
      ramp = "red";
    } else if (dist === 'J') {
      ramp = "green";
    }

    return ramp;
  },

  _keydown: function(e) {
    if (e.keyCode === $.ui.keyCode.LEFT) {
      this._prevPage();
    } else if (e.keyCode === $.ui.keyCode.RIGHT) {
      this._nextPage();
    }
    cdb.admin.BaseDialog.prototype._keydown.call(this, e);
  },

  clean: function() {
    if (this.layer) {
      this.layer.wizard_properties.unbind("load", this._onLoadWizard, this);
    }

    cdb.admin.BaseDialog.prototype.clean.call(this);
  },

  _addHistogram: function(el, column) {

    var self = this;

    var data = column.get("cat_hist").slice(0, 7);
    var color_ramp = this._getRamp(column.get("dist_type"));

    var width = 70;
    var height = 11;
    var minHeight = 2;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var svg = d3.select(el[0]).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g");

    x.domain(data.map(function(d) { return d[0]; }));
    y.domain([0, d3.max(data, function(d) { return d[1]; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("fill", function(d, i) {
          return cdb.admin.color_ramps[color_ramp][7][i];
        })
        .attr("class", "HistogramGraph-bar")
        .attr('data-title', function(d) {
          return Utils.formatNumber(d[1]) 
        })
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", 5)
        .attr("y", function(d) {
          var value = height - y(d[1]);
          var yPos = y(d[1]);
          return value < minHeight ? (height - minHeight) : yPos;
        })
        .attr("height", function(d) {
          var value = height - y(d[1]);
          return value < minHeight ? minHeight : value;
        })

    return this;
  },

  cancel: function() {
    this.model.set("disabled", true);
    this.elder('cancel');
  }

});
