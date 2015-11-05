var _ = require('underscore');
var Template = require('../../core/template');
var View = require('../../core/view');
var Legend = require('./legend');

var MobileLayer = View.extend({

  events: {
    'click h3':    "_toggle",
    "dblclick":  "_stopPropagation"
  },

  tagName: "li",

  className: "cartodb-mobile-layer has-toggle",

  template: Template.compile("<% if (show_title) { %><h3><%- layer_name %><% } %><a href='#' class='toggle<%- toggle_class %>'></a></h3>"),

  /**
   *  Stop event propagation
   */
  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  initialize: function() {

    _.defaults(this.options, this.default_options);

    this.model.bind("change:visible", this._onChangeVisible, this);

  },

  _onChangeVisible: function() {

    this.$el.find(".legend")[ this.model.get("visible") ? "fadeIn":"fadeOut"](150);
    this.$el[ this.model.get("visible") ? "removeClass":"addClass"]("hidden");

    this.trigger("change_visibility", this);

  },

  _toggle: function(e) {

    e.preventDefault();
    e.stopPropagation();

    if (this.options.hide_toggle) return;

    this.model.set("visible", !this.model.get("visible"))

  },

  _renderLegend: function() {

    if (!this.options.show_legends) return;

    if (this.model.get("legend") && (this.model.get("legend").type == "none" || !this.model.get("legend").type)) return;
    if (this.model.get("legend") && this.model.get("legend").items && this.model.get("legend").items.length == 0) return;

    this.$el.addClass("has-legend");

    var legend = new Legend(this.model.get("legend"));

    legend.undelegateEvents();

    this.$el.append(legend.render().$el);

  },

  _truncate: function(input, length) {
    return input.substr(0, length-1) + (input.length > length ? '&hellip;' : '');
  },

  render: function() {

    var layer_name = this.model.get("layer_name");

    layer_name = layer_name ? this._truncate(layer_name, 23) : "untitled";

    var attributes = _.extend(
      this.model.attributes,
      {
        layer_name:   this.options.show_title ? layer_name : "",
        toggle_class: this.options.hide_toggle ? " hide" : ""
      }
    );

    this.$el.html(this.template(_.extend(attributes, { show_title: this.options.show_title } )));


    if (this.options.hide_toggle)   this.$el.removeClass("has-toggle");
    if (!this.model.get("visible")) this.$el.addClass("hidden");
    if (this.model.get("legend"))   this._renderLegend();

    this._onChangeVisible();

    return this;
  }

});

module.exports = MobileLayer;
