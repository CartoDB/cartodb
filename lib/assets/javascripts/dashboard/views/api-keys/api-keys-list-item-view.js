const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const template = require('./api-keys-list-item.tpl');

const REQUIRED_OPTS = [
  'apiKeyModel'
];

module.exports = CoreView.extend({
  tagName: 'li',

  className: 'ApiKeys-list-item',

  events: {
    'click .js-delete': '_onDeleteClick',
    'click .js-regenerate': '_onRegenerateClick'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._apiKeyModel, 'change', this.render);
  },

  render: function () {
    this.$el.html(
      template({
        name: this._apiKeyModel.get('name'),
        token: this._apiKeyModel.get('token'),
        apiGrants: this._apiKeyModel.getApiGrants()
      })
    );

    return this;
  },

  _onDeleteClick: function () {
    this._apiKeyModel.destroy();
  },

  _onRegenerateClick: function () {
    this._apiKeyModel.regenerate();
  }
});
