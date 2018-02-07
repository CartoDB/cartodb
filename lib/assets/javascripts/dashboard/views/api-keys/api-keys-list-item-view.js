const $ = require('jquery');
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const AlertDialogView = require('dashboard/views/api-keys/alert-dialog-view');
const ModalsServiceModel = require('cartodb3/components/modals/modals-service-model');
const template = require('./api-keys-list-item.tpl');
const removeKeyTemplate = require('./alert-remove-key.tpl');
const regenerateKeyTemplate = require('./alert-regenerate-key.tpl');

const REQUIRED_OPTS = [
  'apiKeyModel',
  'onEdit'
];

module.exports = CoreView.extend({
  tagName: 'li',

  className: 'ApiKeys-list-item',

  events: {
    'click .js-edit': '_onItemClick',
    'click .js-delete': '_onDeleteClick',
    'click .js-regenerate': '_onRegenerateClick',
    'click .js-copy': '_onCopyClick'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._modals = new ModalsServiceModel();

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

  _onDeleteClick: function (event) {
    const onSubmit = () => this._apiKeyModel.destroy();

    this._modals.create(function (modalModel) {
      return new AlertDialogView({ modalModel, onSubmit, template: removeKeyTemplate });
    });
  },

  _onRegenerateClick: function () {
    const onSubmit = () => this._apiKeyModel.regenerate();

    this._modals.create(function (modalModel) {
      return new AlertDialogView({ modalModel, onSubmit, template: regenerateKeyTemplate });
    });
  },

  _onCopyClick: function () {
    const $temp = $('<input>');
    const $token = this.$('.js-token');

    $('body').append($temp);
    $temp.val($token.text()).select();
    document.execCommand('copy');
    $temp.remove();
  },

  _onItemClick: function () {
    this._onEdit(this._apiKeyModel);
  }
});
