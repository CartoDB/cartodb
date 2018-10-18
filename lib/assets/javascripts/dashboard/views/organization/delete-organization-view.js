const CoreView = require('backbone/core-view');
const template = require('./delete-organization.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'modalModel',
  'authenticityToken'
];
/**
 *  When an organization owner wants to delete the full organization
 *
 */

module.exports = CoreView.extend({
  options: {
    authenticityToken: ''
  },

  events: {
    'click .js-cancel': '_closeDialog',
    'submit .js-form': '_closeDialog'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    return this.$el.html(template({
      formAction: `${this._userModel.get('base_url')}/organization`,
      authenticityToken: this._authenticityToken,
      passwordNeeded: !!this._userModel.get('needs_password_confirmation')
    }));
  },

  _closeDialog: function () {
    this._modalModel.destroy();
  }
});
