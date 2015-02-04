var cdb = require('cartodb.js');
var moment = require('moment');
var handleAHref = require('new_common/view_helpers/handle_a_href_on_click');
var MapviewsGraph = require('new_dashboard/mapviews_graph');
var LikesView = require('new_common/views/likes/view');
var Utils = require('cdb.Utils');
cdb.admin = require('cdb.admin');

/**
 * Represents a map card on dashboard.
 */
module.exports = cdb.core.View.extend({

  className: 'Maps-listItem',
  tagName: 'li',

  events: {
    'click tag-link': handleAHref,
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
        selected:                map.get('selected'),
        name:                    map.get('name'),
        des:                     map.get('description'),
        short_des:               Utils.truncate(description, this._SHORT_DES),
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
    this.model.on('change', this.render, this);
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

  _renderMapThumbnail: function() {

    var vizjson = "http://" + location.host + "/api/v2/viz/" + this.model.get("id") + "/viz.json";

    var $header = this.$el.find(".js-header");
    var $loader = $header.find(".js-header-loader");

    $header.find(".js-header-loader").show();

    cdb.Image(vizjson).size(300, 170).getUrl(function(error, url) {
      $loader.hide();
      var $img = $("<img class='MapCard-preview' />");
      if (error) {
        console.log(error); // TODO: implement error
      }
      $img.attr("src", url);
      $header.append($img);
      $img.fadeIn(250);
    });

  },

  _onCardClick: function(e) {
    // Let links use default behaviour
    if (e.target.tagName !== 'A') {
      this.killEvent(e);
      this.model.set('selected', !this.model.get('selected'));
    }
  }

})
