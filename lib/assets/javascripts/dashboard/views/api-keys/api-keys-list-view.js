const _ = require('underscore');
const CoreView = require('backbone/core-view');
const PaginationView = require('builder/components/pagination/pagination-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./api-keys-list.tpl');
const loaderTemplate = require('./api-keys-list-loader.tpl');
const ApiKeysListItemView = require('dashboard/views/api-keys/api-keys-list-item-view');

const REQUIRED_OPTS = [
  'apiKeysCollection',
  'stackLayoutModel',
  'userModel'
];

module.exports = CoreView.extend({
  events: {
    'click .js-add': '_onAddClick'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();

    this._onEdit = this._onEdit.bind(this);

    this._apiKeysCollection.fetch();
  },

  _initBinds: function () {
    this.listenTo(this._apiKeysCollection, 'add change remove sync', this.render);
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

    this._apiKeysCollection.status === 'fetched'
      ? this._renderKeys()
      : this._renderLoading();

    return this;
  },

  _renderLoading: function () {
    this.$('.js-api-keys-list').append(loaderTemplate());
  },

  _renderKeys: function () {
    const keys = _.compact([
      this._apiKeysCollection.getMasterKey(),
      this._apiKeysCollection.getDefaultKey(),
      ...this._apiKeysCollection.getRegularKeys()
    ]);

    keys.forEach(apiKeyModel => {
      const view = new ApiKeysListItemView({
        apiKeyModel,
        onEdit: this._onEdit
      });

      this.addView(view);

      this.$('.js-api-keys-list').append(view.render().el);
    });

    this.paginationView = new PaginationView({
      model: this._apiKeysCollection.getPaginationModel()
    });
    this.addView(this.paginationView);
    this.$('.js-api-keys-list').append(this.paginationView.render().el);
  },

  _onAddClick: function () {
    this._stackLayoutModel.goToStep(1);
  },

  _onEdit: function (apiKeyModel) {
    this._stackLayoutModel.goToStep(1, apiKeyModel);
  }
});
