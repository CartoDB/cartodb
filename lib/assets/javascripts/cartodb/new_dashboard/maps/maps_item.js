/**
 *  Maps item.
 *
 */

var cdb = require('cartodb.js');


module.exports = cdb.core.View.extend({

  className: 'Maps-listItem',
  tagName: 'li',

  events: {},

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_dashboard/views/maps_item');
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this.template(this.model.attributes)
    );

    return this;
  }

})
