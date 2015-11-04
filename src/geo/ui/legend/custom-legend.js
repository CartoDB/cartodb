var _ = require('underscore');
var sanitize = require('../../../core/sanitize.js')
var BaseLegend = require('./base-legend');
var LegendItems = require('../legend-items');
var LegendItem = require('../legend-item');

var CustomLegend = BaseLegend.extend({

  className: "custom-legend",
  type: "custom",

  template: _.template('<% if (title && show_title) { %>\n<div class="legend-title"><%- title %></div><% } %><ul></ul>'),

  initialize: function() {
    this.items = this.model.items;
  },

  setData: function(data) {

    this.items = new LegendItems(data);
    this.model.items = this.items;
    this.model.set("items", data);

  },

  _renderItems: function() {

    this.items.each(this._renderItem, this);

  },

  _renderItem: function(item) {

    var template = this.options.itemTemplate || '\t\t<div class="bullet" style="background:<%= value %>"></div>\n\t\t<%- name || "null" %>';

    view = new LegendItem({
      model: item,
      className: (item.get("value") && item.get("value").indexOf("http") >= 0) ? "bkg" : "",
      template: template
    });

    this.$el.find("ul").append(view.render());

  },

  render: function() {

    if (this.model.get("template")) {

      var template = _.template(sanitize.html(this.model.get("template"), this.model.get('sanitizeTemplate')));
      this.$el.html(template(this.model.toJSON()));

    } else {

      this.$el.html(this.template(this.model.toJSON()));

      if (this.items.length > 0) {
        this._renderItems();
      } else {
        this.$el.html('<div class="warning">The legend is empty</div>');
      }
    }

    return this;

  }

});

module.exports = CustomLegend;
