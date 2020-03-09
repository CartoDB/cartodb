const $ = require('jquery');
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const AlertDialogView = require('dashboard/views/api-keys/alert-dialog-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const templateDefault = require('./api-keys-list-item-default.tpl');
const templateMaster = require('./api-keys-list-item-master.tpl');
const templateRegular = require('./api-keys-list-item-regular.tpl');
const deleteKeyTemplate = require('./alert-delete-key.tpl');
const regenerateKeyTemplate = require('./alert-regenerate-key.tpl');
const IconView = require('builder/components/icon/icon-view');

const TEMPLATES = {
  default: templateDefault,
  master: templateMaster,
  regular: templateRegular
};

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
    const template = TEMPLATES[this._apiKeyModel.get('type')];

    this.$el.html(
      template({
        name: this._apiKeyModel.get('name'),
        token: this._apiKeyModel.get('token'),
        apiGrants: this._apiKeyModel.getApiGrants()
      })
    );

    var warningIcon = new IconView({
      placeholder: this.$el.find('.js-icon-warning'),
      icon: 'warning'
    });
    warningIcon.render();
    this.addView(warningIcon);

    return this;
  },

  _onDeleteClick: function (event) {
    const onSubmit = () => this._apiKeyModel.destroy();

    this._modals.create(function (modalModel) {
      return new AlertDialogView({ modalModel, onSubmit, template: deleteKeyTemplate });
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
