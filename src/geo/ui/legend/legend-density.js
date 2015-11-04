var _ = require('underscore');
var DensityLegend = require('./density-legend');
var LegendModel = require('../legend-model');

/**
 * Density Legend public interface
 */
var LegendDensity = DensityLegend.extend({

  type: "density",

  className: "cartodb-legend density",

  initialize: function() {

    this.items    = this.options.items;

    this.model = new LegendModel({
      type:          this.type,
      title:         this.options.title,
      show_title:    this.options.title ? true : false,
      leftLabel:     this.options.left || this.options.leftLabel,
      rightLabel:    this.options.right || this.options.rightLabel,
      colors:        this.options.colors,
      buckets_count: this.options.colors ? this.options.colors.length : 0,
      items:        this.options.items
    });

    this._bindModel();

  },

  _bindModel: function() {

    this.model.bind("change:colors change:template change:title change:show_title change:colors change:leftLabel change:rightLabel", this.render, this);

  },

  _generateColorList: function() {

    return _.map(this.model.get("colors"), function(color) {
      return '<div class="quartile" style="background-color:' + color + '"></div>';
    }).join("");

  },

  render: function() {

    var options = _.extend(this.model.toJSON(), { colors: this._generateColorList() });

    this.$el.html(this.template(options));

    return this;

  }

});

module.exports = LegendDensity;
