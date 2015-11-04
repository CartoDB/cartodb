var _ = require('underscore');
var sanitize = require('../../../core/sanitize');
var BaseLegend = require('./base-legend');

var DensityLegend = BaseLegend.extend({

  className: "density-legend",

  template: _.template('<% if (title && show_title) { %>\n<div class="legend-title"><%- title %></div><% } %><ul><li class="min">\t<%- leftLabel %></li><li class="max">\t<%- rightLabel %></li><li class="graph count_<%- buckets_count %>">\t<div class="colors"><%= colors %>\n\t</div></li></ul>'),

  initialize: function() {

    this.items    = this.model.items;

  },

  setLeftLabel: function(text) {

    this.model.set("leftLabel", text);

  },

  setRightLabel: function(text) {

    this.model.set("rightLabel", text);

  },

  setColors: function(colors) {

    this.model.set("colors", colors);

  },

  _generateColorList: function() {

    var colors = "";

    if (this.model.get("colors")) {

      return _.map(this.model.get("colors"), function(color) {
        return '\n\t\t<div class="quartile" style="background-color:' + color + '"></div>';
      }).join("");

    } else {

      for (var i = 2; i < this.items.length; i++) {
        var color = this.items.at(i).get("value");
        colors += '\n\t\t<div class="quartile" style="background-color:'+color+'"></div>';
      }
    }

    return colors;

  },


  render: function() {

    if (this.model.get("template")) {

      var template = _.template(sanitize.html(this.model.get("template"), this.model.get('sanitizeTemplate')));
      this.$el.html(template(this.model.toJSON()));

    } else {

      if (this.items.length >= 2) {

        this.leftLabel  = this.items.at(0);
        this.rightLabel = this.items.at(1);

        var leftLabel  = this.model.get("leftLabel")  || this.leftLabel.get("value");
        var rightLabel = this.model.get("rightLabel") || this.rightLabel.get("value");

        var colors = this._generateColorList();

        var options = _.extend( this.model.toJSON(), { leftLabel: leftLabel, rightLabel: rightLabel, colors: colors, buckets_count: colors.length });

        this.$el.html(this.template(options));
      }
    }

    return this;

  }

});

module.exports = DensityLegend;
