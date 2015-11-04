var CustomLegend = require('./custom-legend');
var LegendItems = require('../legend-items');
var LegendModel = require('../legend-model');

/**
 * Custom Legend public interface
 */
var LegendCustom = CustomLegend.extend({

  className: "cartodb-legend custom",

  type: "custom",

  initialize: function() {

    this.items = new LegendItems(this.options.data || this.options.items);

    this.model = new LegendModel({
      type: this.type,
      title: this.options.title,
      show_title: this.options.title ? true : false,
      items: this.items.models
    });

    this._bindModel();

  },

  _bindModel: function() {

    this.model.bind("change:items change:template change:title change:show_title", this.render, this);

  }

});


module.exports = LegendCustom;
