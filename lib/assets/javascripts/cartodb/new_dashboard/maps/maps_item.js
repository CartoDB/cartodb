/**
 *  Maps item.
 *
 */

var cdb = require('cartodb.js');


module.exports = cdb.core.View.extend({

  className: 'Maps-listItem',
  tagName: 'li',

  _SHORT_DES: 88,
  _SHORT_NAME: 30,

  events: {
    'click .DefaultTags-item':  '_onTagClick',
    'click .DefaultTitle-link': '_onNameClick',
    'click':                    '_onCardClick'
  },

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_dashboard/views/maps_item');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this.template({
        url:        this._getMapUrl(),
        selected:   this.model.get('selected'),
        name:       this.model.get('name'),
        short_name: this._getShortName(),
        des:        this.model.get('description'),
        short_des:  this._getShortDes(),
        tags:       this._getPreviewTags(),
        tags_count: this.model.get('tags').length,
        tag_route:  this._getTagRoute(),
        privacy:    this.model.get('privacy').toLowerCase(),
        isOwner:    this.model.permission.isOwner(this.user),
        owner:      this.model.permission.owner.renderData(this.user),
        permission: this.model.permission.getPermission(this.user) === cdb.admin.Permission.READ_ONLY ? 'READ': null,
        timeDiff:   moment(this.model.get('created_at')).fromNow(),
        likes:      this.model.get('likes') || 0,
        liked:      this.model.get('liked') || false
      })
    );

    return this;
  },

  // Attributes modifier methods
  _getShortName: function() {
    if (this.model.get('name') && this.model.get('name').length >= this._SHORT_NAME) {
      return this.model.get('name').substr(0, this._SHORT_NAME) + '...'
    }

    return this.model.get('name')
  },

  _getShortDes: function() {
    if (this.model.get('description') && this.model.get('description').length >= this._SHORT_DES) {
      return this.model.get('description').substr(0, this._SHORT_DES) + '...'
    }

    return this.model.get('description')
  },

  _getPreviewTags: function() {
    return this.model.get('tags') && this.model.get('tags').length > 0 && this.model.get('tags').slice(0,3)
  },

  _getTagRoute: function() {
    var url = '/dashboard/' + this.router.model.get('model');

    // Shared view?
    if (!this.router.model.get('exclude_shared')) {
      url += '/shared'
    }

    // Liked view?
    if (this.router.model.get('liked')) {
      url += '/liked'
    }

    // Locked view?
    if (this.router.model.get('locked')) {
      url += '/locked'
    }

    // + tag
    url += '/tag'

    if (this.user.isInsideOrg()) {
      var username = this.user.get('username');
      url = '/u/' + username + url;
    }

    return url;
  },

  _getMapUrl: function() {
    var url = '/viz/' + this.model.get('id') + '/map';

    if (this.user.isInsideOrg()) {
      var owner_username = this.model.permission.owner.get('username');
      url = '/u/' + owner_username + url;
    }

    return url;
  },

  _initBinds: function() {
    this.model.on('change', this.render, this);
  },

  // Events
  _onNameClick: function(e) {
    if (e) e.stopPropagation();
  },

  _onTagClick: function(e) {
    if (e.which !== 2 && e.which !== 3) {
      e.stopPropagation();
      var path = $(e.target).attr('href');
      this.router.navigate(path, { trigger: true });
    }
  },

  _onCardClick: function(e) {
    if (e) e.preventDefault();

    // Change selected state
    this.model.set('selected', !this.model.get('selected'));
  }

})
