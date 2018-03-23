const CoreView = require('backbone/core-view');
const template = require('./user-support.tpl');
const checkAndBuildOpts = require('../../../builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];

/**
 * View to render the user support link in the header.
 * Expected to be created from existing DOM element.
 */
module.exports = CoreView.extend({

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(
      template({
        userType: this._getUserType()
      })
    );

    return this;
  },

  _getUserType: function () {
    var accountType = this._userModel.get('account_type').toLowerCase();

    if (this._userModel.isInsideOrg()) {
      return 'org';
    } else if (accountType === 'internal' || accountType === 'partner' || accountType === 'ambassador') {
      return 'internal';
    } else if (accountType !== 'free') {
      return 'client';
    } else {
      return 'regular';
    }
  }
});
