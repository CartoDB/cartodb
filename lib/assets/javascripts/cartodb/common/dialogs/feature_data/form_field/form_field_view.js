var cdb = require('cartodb.js');
// var Backbone = require('backbone');

/**
 *  Form field view for edit feature metadata
 *
 */

module.exports = cdb.core.View.extend({

  events: {},

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/dialogs/feature_data/form_field/template');
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template(this.model.attributes))
    return this;
  }
  
});