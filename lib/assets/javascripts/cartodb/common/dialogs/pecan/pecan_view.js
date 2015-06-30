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

    _.bindAll(this, "_generateThumbnail", "_analyzeColumn", "_analyzeColumns", "_refreshMapList");

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

      var response = cdb.CartoCSS.guessMap(self.query, column.get("geometry_type"), data.column, data, column.get("bbox"));

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
