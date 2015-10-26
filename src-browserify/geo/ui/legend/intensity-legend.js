var sanitize = require('../../../core/sanitize');
var _ = require('underscore');
var BaseLegend = require('./base-legend');

/**
 * IntensityLegend
 */
var IntensityLegend = BaseLegend.extend({

  className: "intensity-legend",

  template: _.template('<% if (title && show_title) { %>\n<div class="legend-title"><%- title %></div><% } %><ul><li class="min">\t<%- leftLabel %></li><li class="max">\t<%- rightLabel %></li><li class="graph"></li></ul>'),

  initialize: function() {

    this.items       = this.model.items;

  },

  _bindModel: function() {

    this.model.bind("change:template", this.render, this);

  },

  setColor: function(color) {

    this.model.set("color", color);

  },

  setLeftLabel: function(text) {

    this.model.set("leftLabel", text);

  },

  setRightLabel: function(text) {

    this.model.set("rightLabel", text);

  },

  _hexToRGB: function(hex) {

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;

  },

  _rgbToHex: function(r, g, b) {

    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  },

  _calculateMultiply: function(color, steps) {

    var colorHex = this._hexToRGB(color);

    if (colorHex) {

      var r = colorHex.r;
      var g = colorHex.g;
      var b = colorHex.b;

      for (var i = 0; i <= steps; i++) {
        r = Math.round(r * colorHex.r/255);
        g = Math.round(g * colorHex.g/255);
        b = Math.round(b * colorHex.b/255);
      }

      return this._rgbToHex(r,g,b);

    }

    return "#ffffff";

  },

  _renderGraph: function(baseColor) {

    var s = "";

    s+= "background: <%= color %>;";
    s+= "background: -moz-linear-gradient(left, <%= color %> 0%, <%= right %> 100%);";
    s+= "background: -webkit-gradient(linear, left top, right top, color-stop(0%,<%= color %>), color-stop(100%,<%= right %>));";
    s+= "background: -webkit-linear-gradient(left, <%= color %> 0%,<%= right %> 100%);";
    s+= "background: -o-linear-gradient(left, <%= color %> 0%,<%= right %> 100%);";
    s+= "background: -ms-linear-gradient(left, <%= color %> 0%,<%= right %> 100%)";
    s+= "background: linear-gradient(to right, <%= color %> 0%,<%= right %> 100%);";
    s+= "filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='<%= color %>', endColorstr='<%= right %>',GradientType=1 );";
    s+= "background-image: -ms-linear-gradient(left, <%= color %> 0%,<%= right %> 100%)";

    var backgroundStyle = _.template(s);

    var multipliedColor = this._calculateMultiply(baseColor, 4);

    this.$el.find(".graph").attr("style", backgroundStyle({ color: baseColor, right: multipliedColor }));

  },

  render: function() {

    if (this.model.get("template")) {

      var template = _.template(sanitize.html(this.model.get("template"), this.model.get('sanitizeTemplate')));
      this.$el.html(template(this.model.toJSON()));

    } else {

      if (this.items.length >= 3) {

        this.leftLabel  = this.items.at(0);
        this.rightLabel = this.items.at(1);
        var color       = this.model.get("color") || this.items.at(2).get("value");

        var leftLabel   = this.model.get("leftLabel")  || this.leftLabel.get("value");
        var rightLabel  = this.model.get("rightLabel") || this.rightLabel.get("value");

        var options = _.extend( this.model.toJSON(), { color: color, leftLabel: leftLabel, rightLabel: rightLabel });

        this.$el.html(this.template(options));

        this._renderGraph(color);
      }

    }

    return this;

  }

});

module.exports = IntensityLegend;
