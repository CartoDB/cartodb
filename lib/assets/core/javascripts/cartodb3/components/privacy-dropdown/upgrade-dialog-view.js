var CoreView = require('backbone/core-view');
var template = require('./upgrade-dialog.tpl');
var checkAndBuildOpts = require('../../helpers/required-opts');

var REQUIRED_OPTS = [
  'userModel',
  'configModel'
];

module.exports = CoreView.extend({
  className: 'Editor-boxModal Privacy-dialog Privacy-upgrade',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    var showTrial = this._userModel.canStartTrial();
    var upgradeURL = this._configModel.get('upgrade_url');

    this.$el.empty();

    if (showTrial && upgradeURL) {
      this.$el.append(template({
        showTrial: showTrial,
        upgradeURL: upgradeURL
      }));
    }

    return this;
  }
});
