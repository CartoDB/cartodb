var cdb = require('cartodb.js');
var CreateDialog = require('../../common/dialogs/create/create_view');

/**
 * Represents a map card on dashboard.
 */

module.exports = cdb.core.View.extend({

  className: 'MapsList-item',
  tagName: 'li',

  events: {
    'click .js-open': '_openCreateDialog'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('dashboard/maps/placeholder_item');
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this.template({
        desc: this.model.get('short_description'),
        icon: this.model.get('icon')
      })
    );

    return this;
  },

  _openCreateDialog: function() {
    cdb.god.trigger(
      'openCreateDialog',
      {
        type: 'map',
        previewMap: this.model.get('video').id
      }
    );
    cdb.god.trigger("onTemplateSelected", this);
  }

});
