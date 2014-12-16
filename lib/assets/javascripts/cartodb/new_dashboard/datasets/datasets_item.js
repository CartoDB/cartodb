var cdb = require('cartodb.js');
var moment = require('moment');

/**
 * View representing an item in the list under datasets route.
 */
module.exports = cdb.core.View.extend({

  className: 'DatasetsList-item',
  tagName: 'li',

  events: {},

  initialize: function() {
    this.user = this.options.user;
    this.router = this.options.router;
    this.template = cdb.templates.getTemplate('new_dashboard/views/datasets_item');
  },

  render: function() {
    var ds = this.model;
    var user = this.user;
    var isOwner = ds.permission.isOwner(user);
    var tags = ds.get('tags') || [];

    this.$el.html(
      this.template({
        name:                    ds.get('name'),
        isOwner:                 isOwner,
        showPermissionIndicator: !isOwner && ds.permission.getPermission(user) === cdb.admin.Permission.READ_ONLY,
        description:             ds.get('description'),
        privacy:                 ds.get('privacy').toLowerCase(),
        likes:                   ds.get('likes') || 0,
        rows:                    cdb.Utils.formatNumber(ds.get('table').row_count),
        timeDiff:                moment(ds.get('updated_at')).fromNow(),
        tags:                    tags,
        tagsCount:               tags.length,
        searchByTagUrl:          this._searchByTagUrl(),
        maxTagsToShow:           3
      })
    );

    return this;
  },

  // TODO: Extract routing logic, do not belong in the view
  _searchByTagUrl: function() {
    var uri = '/dashboard/' + this.router.model.get('model');

    if (!this.router.model.get('exclude_shared')) {
      uri += '/shared'
    }

    if (this.router.model.get('liked')) {
      uri += '/liked'
    }

    if (this.router.model.get('locked')) {
      uri += '/locked'
    }

    uri += '/tag';

    if (this.user.isInsideOrg()) {
      uri = '/u/' + this.user.get('username') + uri;
    }

    return function(tag) {
      return uri + '/' + encodeURIComponent(tag);
    }
  }
});
