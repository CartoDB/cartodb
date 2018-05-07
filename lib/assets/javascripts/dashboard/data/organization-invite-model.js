const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'organizationId',
  'configModel'
];

module.exports = Backbone.Model.extend({
  defaults: {
    users_emails: [],
    welcome_text: 'I\'d like to invite you to my CARTO organization,\nBest regards'
  },

  initialize: function (attrs, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  url: function () {
    return `/api/v1/organization/${this._organizationId}/invitations`;
  }
});
