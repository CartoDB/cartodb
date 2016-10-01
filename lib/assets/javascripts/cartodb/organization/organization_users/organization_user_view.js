var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var Utils = require('cdb.Utils');
var PaginationView = require('../../common/views/pagination/view');
var pluralizeStr = require('../../common/view_helpers/pluralize_string');

/**
 *  Organization user view within
 *  organization list
 *
 */


module.exports = cdb.core.View.extend({

  className: 'OrganizationList-user',
  tagName: 'li',

  initialize: function() {
    this.template = cdb.templates.getTemplate('organization/organization_users/organization_user');
  },

  render: function() {
    this.$el.html(
      this.template({
        totalPer: this.options.totalPer,
        userPer: this.options.userPer,
        usedPer: this.options.usedPer,
        isOwner: this.options.isOwner,
        isViewer: this.options.isViewer,
        url: this.options.url,
        sizeOnBytes: Utils.readablizeBytes(this.model.get('db_size_in_bytes')),
        quotaInBytes: Utils.readablizeBytes(this.model.get('quota_in_bytes')),
        avatarUrl: this.model.get('avatar_url'),
        username: this.model.get('username'),
        user_email: this.model.get('email'),
        table_count: pluralizeStr.prefixWithCount('Dataset', 'Datasets', this.model.get('table_count')),
        maps_count: pluralizeStr.prefixWithCount('Map', 'Maps', this.model.get('all_visualization_count'))
      })
    );

    this._initViews();

    return this;
  },

  _initViews: function() {}

})
