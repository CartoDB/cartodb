var _ = require('underscore');
var sanitize = require('../../../core/sanitize');
var BaseLegend = require('./base-legend');
var LegendItem = require('../legend-item');

var CategoryLegend = BaseLegend.extend({

  className: "category-legend",

  template: _.template('<% if (title && show_title) { %>\n<div class="legend-title"><%- title %></div><% } %><ul></ul>'),

  initialize: function() {

    this.items = this.model.items;

  },

  _bindModel: function() {

    this.model.bind("change:title change:show_title change:template", this.render, this);

  },

  _renderItems: function() {

    this.items.each(this._renderItem, this);

  },

  _renderItem: function(item) {

    view = new LegendItem({
      model: item,
      className: (item.get("value") && item.get("value").indexOf("http") >= 0 || item.get("type") && item.get("type") == 'image') ? "bkg" : "",
      template: '\t\t<div class="bullet" style="background: <%= value %>"></div> <%- name || ((name === false) ? "false": "null") %>'
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
        this.$el.html('<div class="warning">The category legend is empty</div>');
      }
    }

    return this;

  }

});

module.exports = CategoryLegend;
