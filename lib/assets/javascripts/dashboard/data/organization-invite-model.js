const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'organizationId',
  'configModel'
];

module.exports = Backbone.Model.extend({
  defaults: {
    users_emails: []
  },

  initialize: function (attrs, options) {
    this.attributes['welcome_text'] = 'I\'d like to invite you to my ' + options.configModel['attributes'].app_name + ' organization,\nBest regards';
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  url: function () {
    return `/api/v1/organization/${this._organizationId}/invitations`;
  }
});
