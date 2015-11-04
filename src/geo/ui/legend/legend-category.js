var CategoryLegend = require('./category-legend');
var LegendItems = require('../legend-items');
var LegendModel = require('../legend-model');

/**
 * Category Legend public interface
 */
var LegendCategory = CategoryLegend.extend({

  className: "cartodb-legend category",

  type: "category",

  initialize: function() {

    this.items = new LegendItems(this.options.data);

    this.model = new LegendModel({
      type: this.type,
      title: this.options.title,
      show_title: this.options.title ? true : false
    });

    this._bindModel();

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    this._renderItems();

    return this;

  }

});

module.exports = LegendCategory;
