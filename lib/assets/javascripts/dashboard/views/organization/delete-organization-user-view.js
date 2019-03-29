const CoreView = require('backbone/core-view');
const template = require('./delete-organization-user.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'modalModel',
  'configModel',
  'passwordNeeded',
  'organizationUser',
  'authenticityToken'
];

module.exports = CoreView.extend({
  events: {
    'click .js-cancel': '_closeDialog',
    'submit .js-form': '_closeDialog'
  },

  options: {
    authenticityToken: '',
    organizationUser: {}
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    CoreView.prototype.initialize.apply(this);
  },

  render: function () {
    this.$el.html(template({
      username: this._organizationUser.get('username'),
      formAction: `${this._configModel.prefixUrl()}/organization/users/${this._organizationUser.get('username')}`,
      authenticityToken: this._authenticityToken,
      passwordNeeded: this._passwordNeeded
    }));

    return this;
  },

  _closeDialog: function () {
    if (this._modalModel) {
      this._modalModel.destroy();
    }
  }
});
