var _ = require('underscore');
var templates = require('cdb.templates');
var View = require('../../core/view');

/**
 * Legend item view
 */
var LegendItem = View.extend({

  tagName: "li",

  initialize: function() {

    _.bindAll(this, "render");

    this.template = this.options.template ? _.template(this.options.template) : templates.getTemplate('geo/legend');

  },

  render: function() {

    var value;
    this.model.attributes.name = ""+this.model.attributes.name;
    if (this.model.get("type") == 'image' && this.model.get("value")) {
      value = "url( " + this.model.get("value") + ")";
    } else {
      value = this.model.get("value");
    }

    var options = _.extend( this.model.toJSON(), { value: value });

    this.$el.html(this.template(options));

    return this.$el;
  }

});

module.exports = LegendItem;
