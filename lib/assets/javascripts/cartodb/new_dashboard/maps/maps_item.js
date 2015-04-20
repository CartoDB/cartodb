var cdb = require('cartodb.js');
var moment = require('moment');
var navigateThroughRouter = require('../../new_common/view_helpers/navigate_through_router');
var MapviewsGraph = require('../../new_dashboard/mapviews_graph');
var MapCardPreview = require('../../new_common/views/mapcard_preview');
var LikesView = require('../../new_common/views/likes/view');
var EditableDescription= require('../../new_dashboard/editable_fields/editable_description');
var EditableTags = require('../../new_dashboard/editable_fields/editable_tags');
var Utils = require('cdb.Utils');
cdb.admin = require('cdb.admin');

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

    this.$el.html(
      this.template({
        url:                     map.viewUrl().edit(),
        name:                    map.get('name'),
        privacy:                 map.get('privacy').toLowerCase(),
        isOwner:                 isOwner,
        owner:                   map.permission.owner.renderData(this.user),
        showPermissionIndicator: !isOwner && map.permission.getPermission(this.user) === cdb.admin.Permission.READ_ONLY,
        timeDiff:                moment(map.get('updated_at')).fromNow(),
        likes:                   map.get('likes') || 0,
        liked:                   map.get('liked') || false
      })
    );

    this._renderDescription();
    this._renderTags();
    this._renderMapviewsGraph();
    this._renderLikesIndicator();
    this._renderMapThumbnail();
    this._renderTooltips();
    this._checkSelected();

    return this;
  },

  _initBinds: function() {
    this.model.on('change:selected', this._checkSelected, this);
    this.model.on('change:privacy', this.render, this);
  },

  _renderDescription: function() {
    var isOwner = this.model.permission.isOwner(this.user);
    var view = new EditableDescription({
      el: this.$('.js-item-description'),
      model: this.model,
      editable: isOwner
    });
    this.addView(view.render());
  },

  _renderTags: function() {
    var isOwner = this.model.permission.isOwner(this.user);
    var view = new EditableTags({
      el: this.$('.js-item-tags'),
      model: this.model,
      router: this.router,
      editable: isOwner
    });
    this.addView(view.render());
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

  _renderTooltips: function() {
    // Owner
    if (!this.model.permission.isOwner(this.user)) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$('.UserAvatar'),
          title: function(e) {
            return $(this).attr('data-title')
          }
        })
      )
    }
  },

  _renderMapThumbnail: function() {

    var zoom = this.model.get("zoom");
    var previewZoom = (zoom + 2 <= this.model.map.get("maxZoom")) ? zoom + 2 : zoom;

    var mapCardPreview = new MapCardPreview({
      el: this.$('.js-header'),
      zoom:    previewZoom,
      vizjson: this.model.vizjsonURL(),
      privacy: this.model.get("privacy"),
      user:    this.user
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

  _checkSelected: function() {
    this.$(".MapCard")[this.model.get("selected") ? "addClass" : "removeClass"]("is-selected");
  },

  _openPrivacyDialog: function(ev) {
    this.killEvent(ev);
    cdb.god.trigger('openPrivacyDialog', this.model);
  },

  _onCardClick: function(ev) {
    // Let links use default behaviour
    if (!$(ev.target).closest('a')[0]) {
      this.killEvent(ev);
      var isOwner = this.model.permission.isOwner(this.user);
      if (isOwner) {
        this.model.set('selected', !this.model.get('selected'));
      }
    }
  }

});
