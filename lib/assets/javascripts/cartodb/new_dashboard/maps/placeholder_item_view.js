var cdb = require('cartodb.js');
var CreateDialog = require('../../new_common/dialogs/create/create_view');

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
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_dashboard/maps/placeholder_item');
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
    var createDialog = new CreateDialog({
      type: 'map',
      user: this.user,
      previewMap: this.model.get('video').id,
      clean_on_hide: true
    });
    createDialog.bind('mapCreated', function(vis) {
      window.location = vis.viewUrl().edit();
    }, this);
    createDialog.bind('datasetCreated', function(tableMetadata) {
      var vis = new cdb.admin.Visualization({ name: 'Untitled map' });
      var self = this;
      vis.save({
        tables: [ tableMetadata.get('id') ]
      },{
        success: function(m) {
          window.location = vis.viewUrl().edit();
        },
        error: function(e) {
          createDialog.close();
          self.collection.trigger('error');
        }
      });
    }, this);
    createDialog.bind('datasetSelected', function(d) {
      cdb.god.trigger('datasetSelected', d, this);
    }, this);
    createDialog.bind('remoteSelected', function(d) {
      cdb.god.trigger('remoteSelected', d, this);
    }, this);

    createDialog.appendToBody();
  }

});
