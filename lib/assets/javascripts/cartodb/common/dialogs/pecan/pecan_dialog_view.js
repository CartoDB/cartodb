var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');
var PecanCard = require('./pecan_card');

module.exports = BaseDialog.extend({

  _CARD_WIDTH: 288,
  _CARD_HEIGHT: 170,
  _TABS_PER_ROW: 3,
  _GET_BBOX_FROM_THE_GEOM: true,

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

    this._loadCards();

  },

  _initBinds: function() {
    this.model.bind('change:page', this._moveTabsNavigation, this);
    this._panes.bind('tabEnabled', this.render, this);
  },

  _loadCards: function() {
    this.columns.each(this._loadCard, this);
  },

  _loadCard: function(column) {
    var self = this;

    if (column.get("column") === "the_geom") {
      this.bbox = column.get("bbox");
    }

    if (column.get("success")) {
      this._generateThumbnail(column, function(error, url) {
        if (!error) {
          self._addCard(url, column);
        } else {
          console.log(error);
        }
      });
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

    if (column.get("visualizationType") === 'torque') {
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
    this.$(".js-map-list").width(w * l + (l - 1) * 30);
    this.model.set('maxPages', Math.ceil(this.$('.js-card').size() / this._TABS_PER_ROW));
  },

  _getSuccessColumns: function() {
    return this.columns.filter(function(c) { return c.get("success")});
  },

  _onCardClick: function(column) {

    this.model.set("column", column);

    this.layer = this._getDataLayer();

    this._bindDataLayer();

    var properties = this.layer.wizard_properties.propertiesFromStyle(column.get("css"));

    this.layer.wizard_properties.active(column.get("visualizationType"), properties);

    this._panes.active('applying');

    console.log("%cApplying wizard: " + column.get("visualizationType"), "font-weight: bold; color:brown;");
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

  cancel: function() {
    this.model.set("disabled", true);
    this.elder('cancel');
  }

});
