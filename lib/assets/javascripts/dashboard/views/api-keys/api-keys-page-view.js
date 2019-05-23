
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./api-keys-page.tpl');
const ApiKeysListView = require('dashboard/views/api-keys/api-keys-list-view');
const apiKeysCollectionTypes = require('dashboard/data/api-keys-collection-types');

const REQUIRED_OPTS = [
  'stackLayoutModel',
  'userModel'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      showGoogleApiKeys: this._userModel.showGoogleApiKeys(),
      isInsideOrg: this._userModel.isInsideOrg(),
      isOrgOwner: this._userModel.isOrgOwner(),
      organizationName: this._userModel.getOrgName(),
      googleApiKey: this._userModel.getGoogleApiKey()
    }));

    this._renderList(
      [apiKeysCollectionTypes.MASTER, apiKeysCollectionTypes.DEFAULT].join(','),
      'Default API Keys',
      false
    );
    this._renderList(apiKeysCollectionTypes.REGULAR,
      'Custom API Keys',
      true
    );

    return this;
  },

  _renderList: function (apiKeysType, title, showNewApiKeyButton) {
    const view = new ApiKeysListView({
      stackLayoutModel: this._stackLayoutModel,
      userModel: this._userModel,
      apiKeysType: apiKeysType,
      title,
      showNewApiKeyButton
    });

    this.addView(view);
    this.$('.js-api-keys-page').append(view.render().el);
  }
});
