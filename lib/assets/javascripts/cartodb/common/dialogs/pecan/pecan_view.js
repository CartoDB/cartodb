var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

module.exports = BaseDialog.extend({

  _CARD_WIDTH: 288,
  _CARD_HEIGHT: 170,
  _TABS_PER_ROW: 3,
  _MAX_ROWS: 9000,
  _MAX_COLS: 60,
  _REJECT: 0,
  _KEEP: 1,
  _EXCLUDED_COLUMNS: ['cartodb_id', 'lat', 'lon', 'lng', 'long', 'latitude', 'longitude', 'shape_length', 'shape_area', 'objectid', 'id', 'country', 'state', 'created_at', 'updated_at', 'iso2', 'iso3', 'x_coord', 'y_coord', 'xcoord', 'ycoord'],

  events: cdb.core.View.extendEvents({
    "click .js-goPrev": "_prevPage",
    "click .js-goNext": "_nextPage",
    "click .js-skip"  : "_onSkipClick"
  }),

  initialize: function() {
    this.elder('initialize');

    if (!this.options.map) {
      throw new Error('map is required');
    }

    if (!this.options.table) {
      throw new Error('table is required');
    }

    this._initModels();
    this._initViews();
    this._initBinds();
  },

  _check: function() {
    var tableData     = this.options.table.data();
    var geometryTypes = tableData.table && tableData.table.get("stats_geometry_types");
    var hasGeometries = geometryTypes && geometryTypes.length > 0 ? true : false;

    var row_count = tableData.length;
    var hasRows = row_count > 0 && row_count < this._MAX_ROWS;

    var col_count = _(tableData.query_schema).size();
    var hasColumns = col_count > 0 && col_count < this._MAX_COLS;

    if (hasGeometries && hasRows && hasColumns) {
      return true;
    } else {
      return false;
    }
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

    _.bindAll(this, "_addCard", "_generateThumbnail", "_analyzeColumn", "_analyzeColumns", "_refreshMapList", "_onLoadWizard", "_analyzeStats");

    this.table = this.options.table;
    this.user  = this.options.user;
    this.map   = this.options.map;
    this.bbox  = this.options.map.getViewBounds();
    this.query_schema = this.table.data().query_schema;

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

    if (this._check()) {
      this._panes.active('loading');
      this._start();
    } else {
      this.close();
    }
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

  _initBinds: function() {
    this.model.bind('change:page', this._moveTabsNavigation, this);
    this.columns.bind('change:analyzed, change:success', this._onAnalyzeColumn, this);
    this._panes.bind('tabEnabled', this.render, this);
  },

  _onAnalyzeColumn: function(column) {

    if (this._getAnalyzedColumns().length === this.columns.length) {
      if (this._getSuccessColumns().length === 0) {
        this.close();
      } else {

        var pendingColumns = this._getPendingColumns();

        if (pendingColumns.length > 0) {
          _.each(pendingColumns, function(column) {
            column.set({ analyzed: false, pending: false }, { silent: true });
            this._analyzeColumn(column);
          }, this);
          console.log("%cAnalyzing pending: " + pendingColumns.length + " colum/s", "color: orange; font-weight:bold;");
        } else {
          console.log("%cSuccessfully obtained: " + this._getSuccessColumns().length + " colum/s", "color: green; font-weight:bold;");
          this._guessMaps();
        }
      }
    }
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

    if (this.bbox) {
      cdb.Image(layerDefinition).size(this._CARD_WIDTH, this._CARD_HEIGHT).bbox(this.bbox).getUrl(onImageReady);
    } else {
      cdb.Image(layerDefinition).size(this._CARD_WIDTH, this._CARD_HEIGHT).zoom(this.map.get("zoom")).center(this.map.get("center")).getUrl(onImageReady);
    }

  },

  _printStats: function(column, stats) {

    var name     = column.get("name");
    var type     = column.get("new_type") ? column.get("new_type") : stats.type;
    var weight   = stats.weight;
    var skew     = stats.skew;
    var distinct = stats.distinct;
    var count    = stats.count;
    var null_ratio = stats.null_ratio;

    var distinctPercentage = (distinct / count) * 100;

    console.log("%cAnalyzing %c" + name + "%c: " + this._getAnalyzedColumns().length + "/" + this.columns.length, "text-decoration: underline;", "text-decoration:underline; font-weight:bold", "text-decoration:underline; font-weight:normal");

    console.log('%c · %ctype%c = ' + type, 'color:#666;', 'color: #666; font-weight:bold;', "color: #666; font-weight:normal");
    console.log('%c · %cdistinctPercentage%c = ' + distinctPercentage, 'color:#666;', 'color: #666; font-weight:bold;', "color: #666; font-weight:normal");
    console.log('%c · %ccount%c = ' + count, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    console.log('%c · %cnull ratio%c = ' + null_ratio, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');

    if (skew) {
      console.log("%c · %cskew%c: " + skew.toFixed(2), "color:#666;", 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    } else {
      console.log("%c · %cskew%c: " + skew, "color:#666;", 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    }

    if (weight) {
      console.log("%c · %cweight%c: " + weight.toFixed(2), "color: #666;", "color:#666; font-weight:bold;", "color:#666;font-weight:normal");
    } else {
      console.log("%c · %cweight%c: " + weight, "color: #666;", "color:#666; font-weight:bold;", "color:#666;font-weight:normal");
    }

  },

  _redoMessage: function(name, message, value) {
    console.log('%c > turned into category', "color:pink;");
  },

  _rejectMessage: function(name, message, value) {
    console.log('%c = rejected because ' + message + ": %c" + (value ? value : ""), "color:red;", "color:red; font-weight:bold");
  },

  _approveMessage: function(name) {
    console.log('%c = approved', "color:green;");
  },

  _analyzeStats: function(column, stats) {

    var name  = column.get("name");
    var type = column.get("new_type") ? column.get("new_type") : stats.type;

    this._printStats(column, stats);

    var result = this._REJECT;

    if (type === 'string') {
      result = this._analyzeString(name, stats);
    } else if (type === 'number') {
      result = this._analyzeNumber(name, stats);
    } else if (type === 'boolean') {
      result = this._analyzeBoolean(name, stats);
    } else if (type === 'date') {
      result = this._analyzeDate(name, stats);
    } else if (type === 'geom') {
      if (stats.bbox) {
        this.bbox = stats.bbox;
      }
      return this._REJECT;
    }

    if (result === this._KEEP) {
      this._approveMessage(name);
    }

    return result;

  },

  _analyzeString: function(name, stats) {

    if (stats.weight >= 0.8) {
      return this._KEEP;
    } else if (stats.weight < 0.1 || !stats.weight) {
      this._rejectMessage(name, "weight is 0", stats.weight);
      return this._REJECT;
    }

    if (stats.null_ratio > 0.95) {
      this._rejectMessage(name, "null_ratio > 95%", stats.null_ratio  * 100);
      return this._REJECT;
    }
    return this._KEEP;
  },

  _analyzeNumber: function(name, stats) {

    var distinctPercentage = (stats.distinct / stats.count) * 100;

    if (stats.weight < 0.1 || !stats.weight) {
      this._rejectMessage(name, "weight is 0", stats.weight);
      return this._REJECT;
    }

    if (stats.weight > 0.5 || distinctPercentage < 25) {
      if (distinctPercentage < 1) {
        this._redoMessage(name);
        return this._KEEP; 
      }
      return this._KEEP;
    }

    this._rejectMessage(name, "distinctPercentage is > 25 && weight < 0.5");
    return this._REJECT;
  },

  _analyzeBoolean: function(name, stats) {
    if (stats.null_ratio > 0.75) {
      this._rejectMessage(name, "null_ratio > 75%", stats.null_ratio  * 100);
      return this._REJECT;
    }
    return this._KEEP;
  },

  _analyzeDate: function(name, stats) {
    if (stats.null_ratio > 0.75) {
      this._rejectMessage(name, "null_ratio > 75%", stats.null_ratio  * 100);
      return this._REJECT;
    }
    return this._KEEP;
  },

  _guessMaps: function(){
    _.each(this._getSuccessColumns(), this._guessColumn, this);
  },

  _guessColumn: function(column) {
    var self = this;

    var stats = column.get("stats");

    var response = cdb.CartoCSS.guessMap(this.query, this.table.get("name"), column, stats);

    if (response) {

      column.set({ sql: response.sql, css: response.css, visualizationType: response.visualizationType });

      this._generateThumbnail(column, function(error, url) {
        if (!error) {
          self._addCard(url, response);
        } else {
          column.set({ analyzed: true, success: false });
          console.log("Error on " + column.get("name"), error); // TODO: remove this
        }
      });

    } else {
      column.set({ analyzed: true, success: false });
    }
  },

  _addCard: function(url, response) {
    var self = this;

    var src = url + "?api_key=" + this.user.get("api_key");

    var wizardName = response.visualizationType.charAt(0).toUpperCase() + response.visualizationType.slice(1);

    var null_count = response.stats.null_ratio * response.stats.count;

    var $el = $(cdb.templates.getTemplate('common/dialogs/pecan/card')({
      column: response.column,
      wizard: wizardName,
      metadata: response.metadata,
      null_count: Utils.formatNumber(null_count),
      weight: response.stats.weight,
    }));

    var img = new Image();

    img.onerror = function() {
      console.log("error loading the image for " + response.column);
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
      self.model.set("response", response);
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

  _getPendingColumns: function() {
    return this.columns.filter(function(c) { return c.get("pending")});
  },

  _getAnalyzedColumns: function() {
    return this.columns.filter(function(c) { return c.get("analyzed")});
  },

  _getSuccessColumns: function() {
    return this.columns.filter(function(c) { return c.get("success")});
  },

  _getSimplifiedGeometryType: function(g) {
    return {
      st_multipolygon: 'polygon',
      st_polygon: 'polygon',
      st_multilinestring: 'line',
      st_linestring: 'line',
      st_multipoint: 'point',
      st_point: 'point'
    }[g.toLowerCase()];
  },

  _getGeometryType: function() {
    var geometry_types = this.table.data().table.get("stats_geometry_types")
    return this._getSimplifiedGeometryType(geometry_types[0]);
  },

  _start: function() {
    this.query = 'SELECT * FROM ' + this.table.id;
    this.sql = cdb.admin.SQL();

    this._setupColumns();
    this._analyzeColumns();
  },

  _setupColumns: function() {
    _(this.query_schema).each(function(type, name) {
      this.columns.add({ name: name.concat(""), type: type, geometry_type: this._getGeometryType(), analyzed: false });
    }, this);
  },

  _analyzeColumns: function() {
    this.columns.each(this._analyzeColumn);
  },

  _analyzeColumn: function(column) {
    var self = this;

    if (_.include(this._EXCLUDED_COLUMNS, column.get("name"))) {
      column.set({ analyzed: true, success: false });
      return false;
    }

    var options = {};

    if (column.get("new_type")) {
      options.type = column.get("new_type");
    }

    this.sql.describe(this.query, column.get("name"), options, function(stats) {

      if (!stats) {
        console.log('describe returned no stats for ' + colum.get("name"));
        column.set({ analyzed: true, success: false });
        return;
      }

      var response = self._analyzeStats(column, stats);

      if (response === self._KEEP) {
        column.set({ analyzed: true, success: true, stats: stats });
      } else if (response === self._REJECT) {
        column.set({ analyzed: true, success: false });
      } 

    });
  },

  _geoAttr: function(geometryType) {
    return {
      "line": 'line-color: #A6CEE3',
      'polygon': "polygon-fill: #A6CEE3",
      'point': "marker-fill: #A6CEE3"
    }[geometryType];
  },

  _onCardClick: function() {
    this.layer = this._getDataLayer();

    this._bindDataLayer();

    var properties = this.layer.wizard_properties.propertiesFromStyle(this.model.get("response").css);

    var wizard = this.model.get("response").visualizationType;

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

    var response = this.model.get("response");
    var property = response.column;
    var wizard   = response.visualizationType;

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
    var response = this.model.get("response");

    var property = response.column;
    var stats    = response.stats;
    var type = stats.type;
    var dist = stats.dist_type;

    properties.qfunction  = this._getQFunction(dist);
    properties.color_ramp = this._getRamp(dist);

    console.log("%cApplying: " + properties.color_ramp +  " and " +  properties.qfunction + " to " + property + " (" + dist + ")", 'color: blue; ' );
    return properties;
  },

  _getCategoriesProperties: function(properties) {
    var response = this.model.get("response");
    properties.metadata = response.metadata;
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
  }
});
