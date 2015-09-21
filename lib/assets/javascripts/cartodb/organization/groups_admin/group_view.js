var _ = require('underscore');
var cdb = require('cartodb.js');
var pluralizeStr = require('../../common/view_helpers/pluralize_string');

/**
 * View for an individual group.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'OrganizationList-user',

  initialize: function() {
    _.each(['model', 'url'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
  },

  render: function() {
    var sharedMapsCount = this.model.get('shared_maps_count');
    var sharedDatasetsCount = this.model.get('shared_tables_count');
    this.$el.html(
      this.getTemplate('organization/groups_admin/group')({
        displayName: this.model.get('display_name'),
        sharedMapsCount: pluralizeStr('1 shared map', sharedMapsCount + ' shared maps', sharedMapsCount),
        sharedDatasetsCount: pluralizeStr('1 shared map', sharedDatasetsCount + ' shared datasets', sharedDatasetsCount),
        url: this.options.url
      })
    );
    return this;
  }

});
