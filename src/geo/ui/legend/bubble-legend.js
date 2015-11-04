var _ = require('underscore');
var sanitize = require('../../../core/sanitize.js')
var BaseLegend = require('./base-legend');

var BubbleLegend = BaseLegend.extend({

  className: "bubble-legend",

  template: _.template('<% if (title && show_title) { %>\n<div class="legend-title"><%- title %></div><% } %><ul><li>\t<%- min %></li><li class="graph">\t\t<div class="bubbles"></div></li><li>\t<%- max %></li></ul>'),

  initialize: function() {

    this.items = this.model.items;

  },

  _bindModel: function() {

    this.model.bind("change:template change:title change:show_title change:color change:min change:max", this.render, this);

  },

  setColor: function(color) {
    this.model.set("color", color);
  },

  setMinValue: function(value) {
    this.model.set("min", value);
  },

  setMaxValue: function(value) {
    this.model.set("max", value);
  },

  _renderGraph: function(color) {
    this.$el.find(".graph").css("background", color);
  },

  render: function() {

    if (this.model.get("template")) {

      var template = _.template(sanitize.html(this.model.get("template"), this.model.get('sanitizeTemplate')));
      this.$el.html(template(this.model.toJSON()));

      this.$el.removeClass("bubble-legend");

    } else {

      var color = this.model.get("color") || (this.items.length >= 3 ? this.items.at(2).get("value") : "");

      if (this.items.length >= 3) {

        var min = this.model.get("min") || this.items.at(0).get("value");
        var max = this.model.get("max") || this.items.at(1).get("value");

        var options = _.extend(this.model.toJSON(), { min: min, max: max });

        this.$el.html(this.template(options));

      }

      this._renderGraph(color);
    }

    return this;

  }

});

module.exports = BubbleLegend;
