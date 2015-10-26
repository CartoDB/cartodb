var _ = require('underscore');
var ChoroplethLegend = require('./choropleth-legend');
var LegendModel = require('../legend-model');

/**
 * Choropleth Legend public interface
 */
var LegendChoropleth = ChoroplethLegend.extend({

  type: "choropleth",

  className: "cartodb-legend choropleth",

  initialize: function() {

    this.items    = this.options.items;

    this.model = new LegendModel({
      type:          this.type,
      title:         this.options.title,
      show_title:    this.options.title ? true : false,
      leftLabel:     this.options.left  || this.options.leftLabel,
      rightLabel:    this.options.right || this.options.rightLabel,
      colors:        this.options.colors,
      buckets_count: this.options.colors ? this.options.colors.length : 0
    });

    this.add_related_model(this.model);
    this._bindModel();

  },

  _bindModel: function() {

    this.model.bind("change:template change:title change:show_title change:colors change:leftLabel change:rightLabel", this.render, this);

  },

  _generateColorList: function() {

    return _.map(this.model.get("colors"), function(color) {
      return '\t\t<div class="quartile" style="background-color:' + color + '"></div>';
    }).join("");

  },

  render: function() {

    var options = _.extend(this.model.toJSON(), { colors: this._generateColorList() });

    this.$el.html(this.template(options));

    return this;

  }

});

module.exports = LegendChoropleth;
