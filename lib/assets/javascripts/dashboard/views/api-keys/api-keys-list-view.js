const CoreView = require('backbone/core-view');
const PaginationView = require('builder/components/pagination/pagination-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./api-keys-list.tpl');
const ApiKeysListItemView = require('dashboard/views/api-keys/api-keys-list-item-view');
const loaderTemplate = require('./api-keys-list-loader.tpl');
const ApiKeysCollection = require('dashboard/data/api-keys-collection');

const REQUIRED_OPTS = [
  'stackLayoutModel',
  'userModel',
  'configModel',
  'apiKeysType',
  'title',
  'showNewApiKeyButton',
  'disabled'
];

module.exports = CoreView.extend({
  events: {
    'click .js-add': '_onAddClick'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    if (!this._disabled) {
      this._apiKeysCollection = new ApiKeysCollection(null, { userModel: this._userModel, type: this._apiKeysType });
      this._initBinds();
      this._apiKeysCollection.fetch();
      this._onEdit = this._onEdit.bind(this);
    }
  },

  _initBinds: function () {
    this.listenTo(this._apiKeysCollection, 'add change remove sync', this.render);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      title: this._title,
      showNewApiKeyButton: this._showNewApiKeyButton,
      disabled: this._disabled,
      upgradeUrl: this._configModel.get('upgrade_url')
    }));

    if (!this._disabled && this._apiKeysCollection) {
      this._apiKeysCollection.status === 'fetched'
        ? this._renderKeys()
        : this._renderLoading();
    }

    return this;
  },

  _renderLoading: function () {
    this.$('.js-api-keys-list').append(loaderTemplate());
  },

  _renderKeys: function () {
    this._apiKeysCollection.forEach(apiKeyModel => {
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
