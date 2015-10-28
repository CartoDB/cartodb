var _ = require('underscore');
var LegendModel = require('./legend-model');
var LegendExports = require('./legend-exports');
var View = require('../../core/view');

/**
 * Legend View: wrapper for the different types of legends
 */
var Legend = View.extend({

  className: "cartodb-legend",

  events: {
    "dragstart":            "_stopPropagation",
    "mousedown":            "_stopPropagation",
    "touchstart":           "_stopPropagation",
    "MSPointerDown":        "_stopPropagation",
    "dblclick":             "_stopPropagation",
    "mousewheel":           "_stopPropagation",
    "DOMMouseScroll":       "_stopPropagation",
    "dbclick":              "_stopPropagation",
    "click":                "_stopPropagation"
  },

  initialize: function() {
    _.bindAll(this, "render", "show", "hide");

    _.defaults(this.options, this.default_options);

    this.map = this.options.map;

    this._setupModel();
    this._setupItems();

    this._updateLegendType();
  },

  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  _setupModel: function() {
    if (!this.model) {

      this.model = new LegendModel({
        type: this.options.type || LegendModel.prototype.defaults.type,
        title: this.options.title || LegendModel.prototype.defaults.title,
        show_title: this.options.show_title || LegendModel.prototype.defaults.show_title,
        template: this.options.template || LegendModel.prototype.defaults.template
      });
    }

    this.add_related_model(this.model);

    //this.model.bind("change:template change:type change:items change:title change:show_title",  this._updateLegendType, this);
    this.model.bind("change",  this._updateLegendType, this);
  },

  _updateLegendType: function() {
    var type = this.model.get("type");
    this.legend_name = this._capitalize(type) + "Legend";

    if (type == 'none' || type == null) {
      this.legend_name = null;
      this.model.set({ type: "none" }, { silent: true });
    } else if (!LegendExports[this.legend_name]) {

      // set the previous type
      this.legend_name = null;
      this.model.set({ type: this.model.previous("type") }, { silent: true });
      return;
    }

    this._refresh();
  },

  _capitalize: function(string) {
    if (string && _.isString(string)) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  },

  _refresh: function() {
    var self = this;

    if (this.view) this.view.clean();

    var type  = this.model.get("type");
    var title = this.model.get("title");
    var show_title = this.model.get("show_title");
    var template = this.model.get("template");

    if (type && this.legend_name) {
      this.view = new LegendExports[this.legend_name]({
        model: this.model
      });

      // Set the type as the element class for styling
      this.$el.removeClass();
      this.$el.addClass(this.className + " " + this.model.get("type"));
    } else {
      this.hide();

      this.$el.removeClass();
      this.$el.addClass(this.className + " none");
    }

    this.render();
  },

  _setupItems: function() {
    var self = this;

    this.items = this.model.items;

    if (this.options.data) {
      this.items.reset(this.options.data);
    }

    this.items.bind("add remove change:value change:name", this.render, this);
  },

  render: function() {
    if (this.view) {

      if (this.model.get("template")) {
        this.$el.html(this.view.render().$el.html());
        this.$el.removeClass(this.model.get("type"))
        this.$el.addClass("wrapper");
      } else {
        this.$el.html(this.view.render().$el.html());
      }

      if (this.model.get("visible") === false) {
        this.hide();
      } else {
        this.show();
      }
    }

    return this;
  },

  show: function(callback) {
    var type = this.model.get("type");
    if (type && type != "none") this.$el.show();
  },

  hide: function(callback) {
    if (this.model.get("type")) this.$el.hide();
  }
});

module.exports = Legend;
