const CoreView = require('backbone/core-view');
const ApiKeysCollection = require('dashboard/data/api-keys-collection');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const template = require('./api-keys-list.tpl');
const ApiKeysListItemView = require('dashboard/views/api-keys/api-keys-list-item-view');

const REQUIRED_OPTS = [
  'userModel'
];

module.exports = CoreView.extend({
  events: {},

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._apiKeysCollection = new ApiKeysCollection(null, {
      userModel: this._userModel
    });

    this._initBinds();

    this._apiKeysCollection.fetch();
  },

  _initBinds: function () {
    this.listenTo(this._apiKeysCollection, 'add change remove', this.render);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());
    this._renderKeys();

    return this;
  },

  _renderKeys: function () {
    const keys = [
      // this._apiKeysCollection.getMasterKey(),
      // this._apiKeysCollection.getDefaultKey(),
      ...this._apiKeysCollection.getRegularKeys()
    ];

    keys.forEach(apiKeyModel => {
      const view = new ApiKeysListItemView({ apiKeyModel });

      this.addView(view);

      this.$('.js-api-keys-list').append(view.render().el);
    });
  }
});
