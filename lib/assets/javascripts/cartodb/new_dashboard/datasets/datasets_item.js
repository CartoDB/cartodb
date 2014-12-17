var cdb = require('cartodb.js');
var moment = require('moment');
var Utils = require('cdb.Utils');
var handleAHref = require('new_common/view_helpers/handle_a_href_on_click');

var SHORT_TITLE_MAX_LENGTH = 65;
var SHORT_DESC_MAX_LENGTH = 80;

/**
 * View representing an item in the list under datasets route.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click .DefaultTags-item': handleAHref,
    'click': '_selectDataset'
  },

  initialize: function() {
    this.user = this.options.user;
    this.router = this.options.router;
    this.template = cdb.templates.getTemplate('new_dashboard/views/datasets_item');

    this._initBinds();
  },

  render: function() {
    var vis = this.model;
    var user = this.user;
    var isOwner = vis.permission.isOwner(user);
    var tags = vis.get('tags') || [];

    this.$el.html(
      this.template({
        isRaster:                vis.get('kind') === 'raster',
        isSelected:              vis.get('selected'),
        title:                   vis.get('name'),
        shortTitle:              Utils.truncate(vis.get('name'), SHORT_TITLE_MAX_LENGTH),
        datasetUrl:              this._datasetUrl(),
        isOwner:                 isOwner,
        showPermissionIndicator: !isOwner && vis.permission.getPermission(user) === cdb.admin.Permission.READ_ONLY,
        description:             vis.get('description'),
        shortDescription:        Utils.truncate(vis.get('description') || '', SHORT_DESC_MAX_LENGTH),
        privacy:                 vis.get('privacy').toLowerCase(),
        likes:                   vis.get('likes') || 0,
        rows:                    Utils.formatNumber(vis.get('table').row_count || 0),
        timeDiff:                moment(vis.get('updated_at')).fromNow(),
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
  },

  _initBinds: function() {
    this.model.on('change', this.render, this);
  },

  _datasetUrl: function() {
    // TODO: Points to old dashboard URL, needs to be updated
    return cdb.config.prefixUrl() +'/tables/'+ this.model.get('name')
  },

  _selectDataset: function(ev) {
    // Let links use default behaviour
    if (ev.target.tagName !== 'A') {
      this.killEvent(ev);
      this.model.set('selected', !this.model.get('selected'));
    }
  }
});
