var _ = require('underscore');
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
  'mapcapsCollection',
  'visDefinitionModel',
  'privacyCollection',
  'shareCollection',
  'userModel',
  'configModel'
];

var OPTIONALS_OPT = [
  'isSimple'
];

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

    _.each(OPTIONALS_OPT, function (item) {
      this[item] = opts[item];
    }, this);

    this._hasOrganization = this._userModel.isInsideOrg();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      name: this._visDefinitionModel.get('name'),
      avatar: this._userModel.get('avatar_url'),
      isSimple: !this._hasOrganization
    }));

    this._initViews();

    if (this._hasOrganization === false) {
      var view = new PublishView({
        visDefinitionModel: this._visDefinitionModel,
        shareCollection: this._shareCollection,
        mapcapsCollection: this._mapcapsCollection
      });

      this.$('.js-panes').append(view.render().el);
    } else {
      this._initTabsViews();
    }
    return this;
  },

  _initViews: function () {
    var dropdown = new PrivacyDropdown({
      privacyCollection: this._privacyCollection,
      visDefinitionModel: this._visDefinitionModel,
      userModel: this._userModel
    });

    this.$('.js-dropdown').append(dropdown.render().el);
    this.addView(dropdown);

    var publishButton = new PublishButton({
      visDefinitionModel: this._visDefinitionModel,
      mapcapsCollection: this._mapcapsCollection,
      configModel: this._configModel
    });

    this.$('.js-update').append(publishButton.render().el);
    this.addView(publishButton);

    var shareWith = new ShareWith({
      visDefinitionModel: this._visDefinitionModel
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
