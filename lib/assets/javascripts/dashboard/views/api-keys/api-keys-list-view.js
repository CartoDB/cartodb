const CoreView = require('backbone/core-view');
const ApiKeysCollection = require('dashboard/data/api-keys-collection');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const template = require('./api-keys-list.tpl');

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
    this.listenTo(this._apiKeysCollection, 'sync', this.render);
  },

  render: function () {
    return this.$el.html(
      template({
        masterKey: this._apiKeysCollection.getMasterKey(),
        defualtKey: this._apiKeysCollection.getDefaultKey(),
        regularKeys: this._apiKeysCollection.getRegularKeys()
      })
    );
  }
});
