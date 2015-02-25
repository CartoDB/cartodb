var cdb = require('cartodb.js');
var moment = require('moment');
var navigateThroughRouter = require('../../new_common/view_helpers/navigate_through_router');
var MapviewsGraph = require('../../new_dashboard/mapviews_graph');
var MapCardPreview = require('../../new_dashboard/mapcard_preview');
var LikesView = require('../../new_common/views/likes/view');
var Utils = require('cdb.Utils');
cdb.admin = require('cdb.admin');

var SHORT_DES = 85;

/**
 * Represents a map card on dashboard.
 */
module.exports = cdb.core.View.extend({

  className: 'MapsList-item',
  tagName: 'li',

  events: {
    'click tag-link': navigateThroughRouter,
    'click .js-privacy': '_openPrivacyDialog',
    'click':          '_onCardClick'
  },

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_dashboard/views/maps_item');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var map = this.model;
    var isOwner = map.permission.isOwner(this.user);
    var description = map.get('description') && Utils.stripHTML(markdown.toHTML(map.get('description'))) || '';

    this.$el.html(
      this.template({
        url:                     this._getMapUrl(),
        name:                    map.get('name'),
        des:                     map.get('description'),
        short_des:               Utils.truncate(description, SHORT_DES),
        tags:                    this.model.get('tags') && this.model.get('tags').length > 0 && this.model.get('tags').slice(0,3),
        tags_count:              map.get('tags') && map.get('tags').length || 0,
        routerModel:             this.router.model,
        privacy:                 map.get('privacy').toLowerCase(),
        isOwner:                 isOwner,
        owner:                   map.permission.owner.renderData(this.user),
        showPermissionIndicator: !isOwner && map.permission.getPermission(this.user) === cdb.admin.Permission.READ_ONLY,
        timeDiff:                moment(map.get('updated_at')).fromNow(),
        likes:                   map.get('likes') || 0,
        liked:                   map.get('liked') || false
      })
    );

    this._renderMapviewsGraph();
    this._renderLikesIndicator();
    this._renderMapThumbnail();
    this._checkSelected();

    return this;
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
    this.model.on('change:selected', this._checkSelected, this);
    this.model.on('change:privacy', this.render, this);
  },

  _renderLikesIndicator: function() {
    var view = new LikesView({
      model: this.model.like
    });
    this.$('.js-likes-indicator').replaceWith(view.render().el);
    this.addView(view);
  },

  _renderMapviewsGraph: function() {
    var graph = new MapviewsGraph({
      el:     this.$('.js-header-graph'),
      stats:  this.model.get('stats')
    });
    this.addView(graph.render());
  },

  _checkSelected: function() {
    this.$(".MapCard")[this.model.get("selected") ? "addClass" : "removeClass"]("is-selected");
  },

  _renderMapThumbnail: function() {

    var zoom = this.model.get("zoom");
    var previewZoom = (zoom + 2 <= this.model.map.get("maxZoom")) ? zoom + 2 : zoom;

    var mapCardPreview = new MapCardPreview({
      el: this.$('.js-header'),
      zoom:    previewZoom,
      vizjson: this.model.vizjsonURL(),
      privacy: this.model.get("privacy"),
      api_key: this.user.get("api_key")
    });

    if (this.imageURL) {
      mapCardPreview.loadURL(this.imageURL);
    } else {
      mapCardPreview.load();
    }

    var self = this;

    mapCardPreview.bind("loaded", function(url) {
      self.imageURL = url;
    });

    this.addView(mapCardPreview);
  },

  _openPrivacyDialog: function(ev) {
    this.killEvent(ev);
    cdb.god.trigger('openPrivacyDialog', this.model);
  },

  _onCardClick: function(e) {
    // Let links use default behaviour
    if (!$(e.target).closest('a')[0]) {
      this.killEvent(e);
      this.model.set('selected', !this.model.get('selected'));
    }
  }

});
