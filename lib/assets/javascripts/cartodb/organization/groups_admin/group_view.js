var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var pluralizeStr = require('../../common/view_helpers/pluralize_string');

/**
 * View for an individual group.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'OrganizationList-user',
  _PREVIEW_COUNT: 3,

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
        sharedDatasetsCount: pluralizeStr('1 shared dataset', sharedDatasetsCount + ' shared datasets', sharedDatasetsCount),
        url: this.options.url,
        previewUsers: this.model.users.toArray().slice(0, this._PREVIEW_COUNT),
        usersCount: Math.max(this.model.users.length - this._PREVIEW_COUNT, 0)
      })
    );
    return this;
  }

});
