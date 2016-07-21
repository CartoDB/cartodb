var _ = require('underscore');
var moment = require('moment');
var CoreView = require('backbone/core-view');
var template = require('./publish.tpl');
var TabPaneTemplate = require('./tab-pane-submenu.tpl');
var createTextLabelsTabPane = require('../../tab-pane/create-text-labels-tab-pane');
var PublishView = require('./publish/publish-view');
var ShareView = require('./share/share-view');
var PrivacyDropdown = require('../../privacy-dropdown/privacy-dropdown-view');
var PublishButton = require('./publish-button-view');
var ShareWith = require('./share-with-view');

var REQUIRED_OPTS = [
  'modalModel',
  'visDefinitionModel',
  'privacyCollection',
  'userModel',
  'configModel'
];

var MODE_FULL = 'full';
var MODE_SHARE = 'share';
var MODE_PUBLISH = 'publish';

module.exports = CoreView.extend({
  className: 'Publish-modal',

  events: {
    'click .js-done': '_onDone'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    // Optional options
    this._mapcapsCollection = opts.mapcapsCollection;
    this._shareCollection = opts.shareCollection;
    this.mode = opts.mode || MODE_FULL;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      name: this._visDefinitionModel.get('name'),
      avatar: this._userModel.get('avatar_url'),
      isSimple: !this._hasTabs()
    }));

    this._initViews();

    if (this.mode === MODE_FULL) {
      if (!this._hasOrganization()) {
        this._makePublishView();
      } else {
        this._initTabsViews();
      }
    } else if (this.mode === MODE_SHARE) {
      this._makeShareView();
    } else if (this.mode === MODE_PUBLISH) {
      this._makePublishView();
    }

    return this;
  },

  _hasOrganization: function () {
    return this._userModel.isInsideOrg();
  },

  _hasTabs: function () {
    var hasOrganization = this._hasOrganization();
    return hasOrganization && this.mode !== MODE_PUBLISH;
  },

  _makePublishView: function () {
    var view = this._createPublishView();
    this.$('.js-panes').append(view.render().el);
    this.addView(view);
  },

  _makeShareView: function () {
    var view = this._createShareView();
    this.$('.js-panes').append(view.render().el);
    this.addView(view);
  },

  _initViews: function () {
    var dropdown;
    var publishButton;
    var shareWith;

    dropdown = new PrivacyDropdown({
      privacyCollection: this._privacyCollection,
      visDefinitionModel: this._visDefinitionModel,
      userModel: this._userModel
    });

    this.$('.js-dropdown').append(dropdown.render().el);
    this.addView(dropdown);

    if (this._mapcapsCollection !== undefined) {
      publishButton = new PublishButton({
        visDefinitionModel: this._visDefinitionModel,
        mapcapsCollection: this._mapcapsCollection,
        configModel: this._configModel
      });

      this.$('.js-update').append(publishButton.render().el);
      this.addView(publishButton);
    } else {
      this.$('.js-update').html(moment(this._visDefinitionModel.get('updated_at')).fromNow());
    }

    shareWith = new ShareWith({
      visDefinitionModel: this._visDefinitionModel,
      displayBig: true
    });
    this.$('.js-share-users').append(shareWith.render().el);
    this.addView(shareWith);
  },

  _initTabsViews: function () {
    var self = this;

    var tabPaneTabs = [{
      name: 'share',
      label: _t('components.modals.publish.menu.share'),
      createContentView: self._createShareView.bind(self)
    }, {
      name: 'publish',
      label: _t('components.modals.publish.menu.publish'),
      createContentView: self._createPublishView.bind(self)
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavSubmenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavSubmenu-link u-upperCase Publish-modalLink'
      }
    };

    this._layerTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$('.js-panes').append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);
  },

  _createShareView: function () {
    return new ShareView({
      className: 'Share-wrapper',
      currentUserId: this._userModel.id,
      visDefinitionModel: this._visDefinitionModel,
      organization: this._userModel._organizationModel,
      configModel: this._configModel
    });
  },

  _createPublishView: function () {
    return new PublishView({
      visDefinitionModel: this._visDefinitionModel,
      shareCollection: this._shareCollection,
      mapcapsCollection: this._mapcapsCollection
    });
  },

  _onDone: function () {
    this._modalModel.destroy();
  }
});
