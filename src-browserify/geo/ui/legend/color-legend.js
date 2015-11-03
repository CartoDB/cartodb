var _ = require('underscore');
var BaseLegend = require('./base-legend');
var LegendItem = require('../legend-item');

var ColorLegend = BaseLegend.extend({

  className: "color-legend",

  type: "color",

  template: _.template('<% if (title && show_title) { %>\n<div class="legend-title"><%- title %></div><% } %><ul></ul>'),

  initialize: function() {

    this.items = this.model.items;

  },

  _renderItems: function() {

    this.items.each(this._renderItem, this);

  },

  _renderItem: function(item) {

    view = new LegendItem({
      model: item,
      className: (item.get("value") && item.get("value").indexOf("http") >= 0) ? "bkg" : "",
      template: '\t\t<div class="bullet" style="background: <%= value %>"></div> <%- name || ((name === false) ? "false": "null") %>'
    });

    this.$el.find("ul").append(view.render());

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    if (this.items.length > 0) {
      this._renderItems();
    } else {
      this.$el.html('<div class="warning">The color legend is empty</div>');
    }

    return this;

  }

});

module.exports = ColorLegend;
