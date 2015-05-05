var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * View model for a share view modal.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    vis: undefined,
    permission: undefined,
    organization: undefined,
    search: ''
  },

  initialize: function(attrs) {
    if (!attrs.vis) throw new Error('vis is required');
    if (!attrs.organization) throw new Error('organization is required');

    var vis = this.get('vis');
    this.set('permission', vis.permission.clone());

    if (!vis.isVisualization()) {
      var self = this;
      vis.tableMetadata().fetch({
        silent: true,
        success: function() {
          if (self.get('state') === 'Share') {
            self.changeState('Share');
          }
        }
      });
    }
  },

  name: function() {
    return this.get('vis').get('name');
  },

  usersUsingVis: function() {
    var metadata = this.get('vis').tableMetadata();
    return _.chain(_.union(
        metadata.get('dependent_visualizations'),
        metadata.get('non_dependent_visualizations')
      ))
      .compact()
      .map(function(d) {
        return d.permission.owner;
      })
      .value();
  },

  canChangeWriteAccess: function() {
    return !this.get('vis').isVisualization();
  },

  organizationUsers: function() {
    var search = this.get('search').toLowerCase().trim();
    return this.get('organization').users.filter(function(user) {
      if (search) {
        return user.get('username').toLowerCase().indexOf(search) === 0;
      } else {
        return true;
      }
    }, this);
  }

});
