const $ = require('jquery');
const moment = require('moment');
const CoreView = require('backbone/core-view');
const navigateThroughRouter = require('builder/helpers/navigate-through-router');
const MapviewsGraph = require('dashboard/components/mapviews-graph/mapviews-graph-view');
const MapCardPreview = require('dashboard/components/mapcard-preview-view');
const LikesView = require('dashboard/components/likes/like-view');
const EditableDescription = require('dashboard/components/editable-fields/editable-description');
const EditableTags = require('dashboard/components/editable-fields/editable-tags');
const TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
const ChangePrivacyView = require('dashboard/views/dashboard/dialogs/change-privacy/change-privacy-view');
const template = require('./maps-item.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'routerModel',
  'userModel',
  'configModel',
  'modals'
];

/**
 * Represents a map card on dashboard.
 */
module.exports = CoreView.extend({
  className: 'MapsList-item',
  tagName: 'li',

  events: {
    'click tag-link': navigateThroughRouter,
    'click .js-privacy': '_openPrivacyDialog',
    'click': '_onCardClick'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    let url = this.model.viewUrl(this._userModel);
    url = this._routerModel.model.get('liked') && !this.model.permission.hasAccess(this._userModel) ? url.public() : url.edit();

    this.$el.html(
      template({
        url,
        name: this.model.get('name'),
        privacy: this.model.get('privacy').toLowerCase(),
        isOwner: this.model.permission.isOwner(this._userModel),
        owner: this.model.permission.owner.renderData(this._userModel),
        showPermissionIndicator: !this.model.permission.hasWriteAccess(this._userModel),
        timeDiff: moment(this.model.get('updated_at')).fromNow(),
        likes: this.model.get('likes') || 0,
        liked: this.model.get('liked') || false
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

  _initBinds: function () {
    this.model.on('change:selected', this._checkSelected, this);
    this.model.on('change:privacy', this.render, this);
  },

  _renderDescription: function () {
    const isOwner = this.model.permission.isOwner(this._userModel);
    const view = new EditableDescription({
      el: this.$('.js-item-description'),
      model: this.model,
      editable: isOwner && this._userModel.hasCreateMapsFeature()
    });
    this.addView(view.render());
  },

  _renderTags: function () {
    const isOwner = this.model.permission.isOwner(this._userModel);
    const view = new EditableTags({
      el: this.$('.js-item-tags'),
      model: this.model,
      routerModel: this._routerModel,
      editable: isOwner && this._userModel.hasCreateMapsFeature()
    });
    this.addView(view.render());
  },

  _renderLikesIndicator: function () {
    const view = new LikesView({
      model: this.model.like
    });
    this.$('.js-likes-indicator').replaceWith(view.render().el);
    this.addView(view);
  },

  _renderMapviewsGraph: function () {
    const graph = new MapviewsGraph({
      el: this.$('.js-header-graph'),
      stats: this.model.get('stats')
    });
    this.addView(graph.render());
  },

  _renderTooltips: function () {
    // Owner
    if (!this.model.permission.isOwner(this._userModel)) {
      this.addView(
        new TipsyTooltipView({
          el: this.$('.UserAvatar')
        })
      );
    }
  },

  _renderMapThumbnail: function () {
    const owner = this.model.permission.owner;
    const ownerUsername = owner.get('username');

    const mapCardPreview = new MapCardPreview({
      el: this.$('.js-header'),
      privacy: this.model.get('privacy'),
      mapsApiResource: this._configModel.getMapsResourceName(ownerUsername),
      username: ownerUsername,
      visId: this.model.get('id'),
      authTokens: this.model.get('auth_tokens'),
      config: this._configModel
    });

    if (this.imageURL) {
      mapCardPreview.loadURL(this.imageURL);
    } else {
      mapCardPreview.load();
    }

    mapCardPreview.bind('loaded', url => {
      this.imageURL = url;
    });

    this.addView(mapCardPreview);
  },

  _checkSelected: function () {
    this.$('.MapCard')[this.model.get('selected') ? 'addClass' : 'removeClass']('is-selected');
  },

  _openPrivacyDialog: function (event) {
    this.killEvent(event);

    this._modals.create(modalModel => {
      return new ChangePrivacyView({
        visModel: this.model,
        userModel: this._userModel,
        configModel: this._configModel,
        modals: this._modals,
        modalModel
      });
    });
  },

  _onCardClick: function (event) {
    // Let links use default behaviour
    if (!$(event.target).closest('a')[0]) {
      this.killEvent(event);
      const isOwner = this.model.permission.isOwner(this._userModel);
      if (isOwner) {
        this.model.set('selected', !this.model.get('selected'));
      }
    }
  }

});
