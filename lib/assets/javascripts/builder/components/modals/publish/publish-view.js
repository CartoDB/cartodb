var moment = require('moment');
var CoreView = require('backbone/core-view');
var template = require('./publish.tpl');
var TabPaneTemplate = require('./tab-pane-submenu.tpl');
var createTextLabelsTabPane = require('builder/components/tab-pane/create-text-labels-tab-pane');
var PublishView = require('./publish/publish-view');
var ShareView = require('./share/share-view');
var PrivacyDropdown = require('builder/components/privacy-dropdown/privacy-dropdown-view');
var PublishButton = require('./publish-button-view');
var ShareWith = require('./share-with-view');
var UpgradeView = require('./upgrade-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'modalModel',
  'visDefinitionModel',
  'privacyCollection',
  'userModel',
  'configModel',
  'isOwner'
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
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    // Optional options
    this._mapcapsCollection = opts.mapcapsCollection;
    this.mode = opts.mode || MODE_FULL;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      name: this._visDefinitionModel.get('name'),
      isSimple: !this._hasTabs(),
      hasShareStats: this._hasShareStats()
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

  _hasShareStats: function () {
    return this.mode !== MODE_PUBLISH && this._hasOrganization();
  },

  _hasOrganization: function () {
    return this._userModel.isInsideOrg();
  },

  _hasTabs: function () {
    var hasOrganization = this._hasOrganization();
    return hasOrganization && this.mode === MODE_FULL;
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
    var upgradeView;
    var publishedOn;

    dropdown = new PrivacyDropdown({
      privacyCollection: this._privacyCollection,
      visDefinitionModel: this._visDefinitionModel,
      mapcapsCollection: this._mapcapsCollection,
      userModel: this._userModel,
      configModel: this._configModel,
      isOwner: this._isOwner
    });

    this.$('.js-dropdown').append(dropdown.render().el);
    this.addView(dropdown);

    if (this._mapcapsCollection !== undefined) {
      publishButton = new PublishButton({
        visDefinitionModel: this._visDefinitionModel,
        mapcapsCollection: this._mapcapsCollection,
        configModel: this._configModel,
        userModel: this._userModel
      });

      this.$('.js-update').append(publishButton.render().el);
      this.addView(publishButton);
    } else {
      publishedOn = _t('components.modals.publish.share.last-published', { date:
                      moment(this._visDefinitionModel.get('updated_at')).format('Do MMMM YYYY, HH:mm')
      });

      this.$('.js-update').html(publishedOn);
    }

    if (this._hasShareStats()) {
      shareWith = new ShareWith({
        visDefinitionModel: this._visDefinitionModel,
        userModel: this._userModel,
        avatarClass: 'Share-user--big',
        separationClass: 'u-rSpace--xl'
      });
      this.$('.js-share-users').append(shareWith.render().el);
      this.addView(shareWith);
    }

    if (!this._hasOrganization()) {
      upgradeView = new UpgradeView();
      this.$('.js-upgrade').append(upgradeView.render().el);
      this.addView(upgradeView);
    }
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
          klassName: 'CDB-NavSubmenu-item'
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
      mapcapsCollection: this._mapcapsCollection,
      userModel: this._userModel
    });
  },

  _onDone: function () {
    this._modalModel.destroy();
  }
});
