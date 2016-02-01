var cdb = require('cartodb.js-v3');
var Utils = require('cdb.Utils');
var Pecan = require('cartodb-pecan');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');
var PecanCard = require('./pecan_card');

module.exports = BaseDialog.extend({

  _CARD_MARGIN: 20,
  _CARD_WIDTH: 288,
  _CARD_HEIGHT: 170,
  _STROKE_PX_LIMIT: 0.04,
  _TABS_PER_ROW: 3,
  _GET_BBOX_FROM_THE_GEOM: true,
  _DEFAULT_BASEMAP_TEMPLATE: "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  _SUPPORTED_BASEMAPS: ["light_all", "dark_all", "light_nolabels", "dark_nolabels", "base-antique", "base-flatblue", "toner", "watercolor"],

  events: BaseDialog.extendEvents({
    "click .js-goPrev": "_prevPage",
    "click .js-goNext": "_nextPage",
    "click .js-skip"  : "cancel"
  }),

  initialize: function() {
    this.elder('initialize');

    if (!this.options.vis) {
      throw new Error('vis is required');
    }

    if (!this.options.user) {
      throw new Error('user is required');
    }

    this.columns = this.options.collection;
    this.add_related_model(this.collection);

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
    this.model = new cdb.core.Model({ page: 1, maxPages: 0 });
  },

  _initViews: function() {

    _.bindAll(this, "_addCard", "_generateThumbnail", "_refreshMapList", "_setWizardProperties");

    this.vis   = this.options.vis;
    this.map   = this.vis.map;
    this.user  = this.options.user;

    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });

    this.addView(this._panes);

    this._panes.addTab('vis',
      ViewFactory.createByTemplate('common/dialogs/pecan/template', {
      })
    );

    this._panes.addTab('applying',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Applying style…',
        quote: randomQuote()
      })
    );

    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Loading previews…',
        quote: randomQuote()
      })
    );

    this._getBBox();
    this._sendOpenStats();
    this._loadCards();

  },

  _initBinds: function() {
    this.model.bind('change:page', this._moveTabsNavigation, this);
    this._panes.bind('tabEnabled', this.render, this);
  },

  _getBBox: function() {
    this.columns.each(function(column) {
      if (column.get("column") === "the_geom") {
        this.bbox = column.get("bbox");
      }
    }, this);
  },

  _loadCards: function() {
    this.columns.each(this._loadCard, this);
  },

  _loadCard: function(column) {
    var self = this;

    if (column.get("success")) {
      this._generateThumbnail(column, function(error, url) {
        if (!error) {
          self._addCard(url, column);
        } else {
          cdb.log.error(error);
        }
      });
    }
  },

  _sendAppliedStats: function() {
    cdb.god.trigger('metrics', 'applied_pecan', {
      email: window.user_data.email
    });
  },

  _sendOpenStats: function() {
    cdb.god.trigger('metrics', 'open_pecan_list', {
      email: window.user_data.email
    });
  },

  _skip: function() {
    var layerID = this.vis.get("active_layer_id");
    var name;
    var activeLayer  = this.vis.map.layers.where({ id: layerID });

    if (activeLayer) {
      name = activeLayer[0].table.get("name");
    }

    var skipPencanDialog = 'pecan_' + this.options.user.get("username") + "_" + name;
    localStorage[skipPencanDialog] = true;
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
    var rowWidth = 960;

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

  _setupCSS: function(css, geometryType) {
    var row_count = this.options.vis.tableMetadata().get("row_count");
    var removeStrokeIndex = row_count / (this._CARD_WIDTH * this._CARD_HEIGHT);
    var removeStroke = (removeStrokeIndex > this._STROKE_PX_LIMIT);

    if (geometryType !== "line" && removeStroke) {
      css = css.replace("marker-line-width: 1;", "marker-line-width: 0.7;");
      css = css.replace("marker-width: 10;", "marker-width: 7;");
    }

    return css;
  },

  _setupTemplate: function() {
    var template = this.map.getLayerAt(0).get("urlTemplate");

    if (template) {
      var supportedBasemap = _.find(this._SUPPORTED_BASEMAPS, function(basemap) {
        return template.indexOf(basemap) !== -1
      });
    }

    if (!template || !supportedBasemap) {
      template = this._DEFAULT_BASEMAP_TEMPLATE;
    }

    return template;
  },

  _generateLayerDefinition: function(column) {

    var type = column.get("visualizationType");
    var sql = column.get("sql");
    var css = this._setupCSS(column.get("css"), column.get("geometryType"));

    var api_key  = this.user.get("api_key");
    var maps_api_template = cdb.config.get('maps_api_template');

    var template = this._setupTemplate();

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

    if (type === "torque" || type === "heatmap"){
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

    var layerDefinition = this._generateLayerDefinition(column);

    var onImageReady = function(error, url) {
      callback && callback(error, url);
    };

    var the_geom = this.columns.find(function(column) {
      return column.get("column") === 'the_geom'
    });

    if (this.bbox && this._GET_BBOX_FROM_THE_GEOM) {
      cdb.Image(layerDefinition).size(this._CARD_WIDTH, this._CARD_HEIGHT).bbox(this.bbox).getUrl(onImageReady);
    } else {
      cdb.Image(layerDefinition).size(this._CARD_WIDTH, this._CARD_HEIGHT).zoom(this.map.get("zoom")).center(this.map.get("center")).getUrl(onImageReady);
    }

  },

  _addCard: function(url, column) {

    var card = new PecanCard({
      url: url,
      urlTemplate: this.map.getLayerAt(0).get("urlTemplate"),
      api_key: this.user.get("api_key"),
      model: column
    });

    card.bind("click", this._onCardClick, this);
    card.render();

    this._panes.active('vis');

    if (this._getSuccessColumns().length < 3) {
      this.$(".js-map-list").addClass("is--centered");
    }

    if (column.get("visualizationType") === 'heatmap' || column.get("visualizationType") === 'torque') {
      this.$(".js-map-list").prepend(card.$el);
    } else {
      this.$(".js-map-list").append(card.$el);
    }

    this._refreshMapList(card.$el);
    this._refreshNavigation();
  },

  _refreshMapList: function($el) {
    var w = $el.width();
    var l = this.$(".js-card").length;
    this.$(".js-map-list").width(w * l + (l - 1) * this._CARD_MARGIN);
    this.model.set('maxPages', Math.ceil(this.$('.js-card').size() / this._TABS_PER_ROW));
  },

  _getSuccessColumns: function() {
    return this.columns.filter(function(c) { return c.get("success")});
  },

  _bindDataLayer: function() {
    this.layer.wizard_properties.unbind("load", this._setWizardProperties, this);
    this.layer.wizard_properties.bind("load", this._setWizardProperties, this);
  },

  _getProperties: function(column) {

    var property = column.get("column");
    var wizard = this._getWizardName(column.get("visualizationType"));

    var properties = { property: property };

    if (wizard === "category") {
      return this._getCategoriesProperties(properties);
    } else if (wizard === 'choropleth') {
      return this._getChoroplethProperties(properties);
    } else if(wizard === "heatmap") {
      return this._getHeatmapProperties(properties);
    }

  },

  _onCardClick: function(column) {
    this._panes.active('applying');
    this.model.set("column", column);

    this._skip();

    this.layer = this._getDataLayer();

    this._sendAppliedStats();

    var wizard = this._getWizardName(column.get("visualizationType"));
    var properties = this._getProperties(column);

    this._bindDataLayer();
    this.layer.wizard_properties.active(wizard, properties);
  },

  _getWizardName: function(name){
    var mappings = {"heatmap": "torque_heat"};
    return mappings[name] || name;
  },

  _getDataLayer: function() {
    return this.map.layers.getDataLayers()[0];
  },

  _setWizardProperties: function() { // TODO: hack, we should find a way to remove this
    var properties = this._getProperties(this.model.get("column"));
    this.layer.wizard_properties.unbind("load", this._setWizardProperties, this);
    if (properties) {
      this.layer.wizard_properties.set(properties);
    }
    this.close();
  },

  _getChoroplethProperties: function(properties) {
    var column = this.model.get("column");

    var property = column.get("column");
    var type     = column.get("type");
    var dist     = column.get("dist_type");
    var stats    = column.get("stats");

    properties.qfunction  = this._getQFunction(dist);
    properties.color_ramp = Pecan.getMethodProperties(stats).name;

    return properties;
  },

  _getCategoriesProperties: function(properties) {
    var column = this.model.get("column");
    properties.metadata   = column.get("metadata");
    properties.categories = column.get("metadata");
    return properties;
  },

  _getHeatmapProperties: function(properties){
    properties.property = "cartodb_id";
    properties["torque-resolution"] = 2;
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

  _keydown: function(e) {
    if (e.keyCode === $.ui.keyCode.LEFT) {
      this._prevPage();
    } else if (e.keyCode === $.ui.keyCode.RIGHT) {
      this._nextPage();
    }
    BaseDialog.prototype._keydown.call(this, e);
  },

  clean: function() {
    if (this.layer) {
      this.layer.wizard_properties.unbind("load", this._setWizardProperties, this);
    }

    BaseDialog.prototype.clean.call(this);
  },

  cancel: function(e) {
    this.killEvent(e);
    this.model.set('disabled', true);
    this._skip();
    this.elder('cancel');
  }

});
