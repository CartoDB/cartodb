var cdb = require('cdb'); // cdb.geo.ui.Legend.*
var _ = require('underscore');
var Legends = require('../legends');
var LegendModel = require('../legend-model');
var StackedLegend = require('./stacked-legend');

/**
 * Stacked Legend public interface
 */
var LegendStacked = StackedLegend.extend({

  initialize: function() {

    if (this.options.legends) {

      var legendModels = _.map(this.options.legends, function(legend) {
        return legend.model;
      });

      this.legendItems = new Legends(legendModels);

      this.legendItems.bind("add remove change", this.render, this);

    } else if (this.options.data) {

      var legendModels = _.map(this.options.data, function(legend) {
        return new LegendModel(legend);
      });

      this.legendItems = new Legends(legendModels);

      this.legendItems.bind("add remove change", this.render, this);

    }

  },

  _capitalize: function(string) {
    if (string && _.isString(string)) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  },

  render: function() {

    this.$el.empty();

    this.legends = [];

    if (this.legendItems && this.legendItems.length > 0) {

      this.legendItems.each(this._renderLegend, this);

    }

    return this;

  },

  _renderLegend: function(model) {

    var type = model.get("type");

    if (!type) type = "custom";

    type = this._capitalize(type);

    // TODO: Necessary evil, can't require since end up with circular references; how to solve better?
    var view = new cdb.geo.ui.Legend[type](model.attributes);

    this.legends.push(view);

    if (model.get("visible") !== false) this.$el.append(view.render().$el);

  },

  getLegendAt: function(n) {

    return this.legends[n];

  },

  addLegend: function(attributes) {

    var legend = new LegendModel(attributes);
    this.legendItems.push(legend);

  },

  removeLegendAt: function(n) {

    var legend = this.legendItems.at(n);
    this.legendItems.remove(legend);

  }

});

module.exports = LegendStacked;
