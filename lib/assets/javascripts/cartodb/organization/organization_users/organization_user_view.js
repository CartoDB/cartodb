var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var Utils = require('cdb.Utils');
var PaginationView = require('../../common/views/pagination/view');

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
        url: this.options.url,
        sizeOnBytes: Utils.readablizeBytes(this.model.get('db_size_in_bytes')),
        quotaInBytes: Utils.readablizeBytes(this.model.get('quota_in_bytes')),
        avatarUrl: this.model.get('avatar_url'),
        username: this.model.get('username'),
        user_email: this.model.get('email'),
        table_count: this.model.get('table_count'),
        maps_count: this.model.get('maps_count')
      })
    );

    console.log(this.model);

    this._initViews();

    return this;
  },

  _initViews: function() {}

})