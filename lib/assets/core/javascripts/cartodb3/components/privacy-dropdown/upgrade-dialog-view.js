var CoreView = require('backbone/core-view');
var template = require('./upgrade-dialog.tpl');
var _ = require('underscore');

var REQUIRED_OPTS = [
  'userModel',
  'configModel'
];

module.exports = CoreView.extend({
  className: 'Editor-boxModal Privacy-dialog Privacy-upgrade',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    var showTrial = this._userModel.canStartTrial();
    var upgradeUrl = this._configModel.get('upgrade_url');

    this.$el.empty();

    if (showTrial && upgradeURL) {
      this.$el.append(template({
        showTrial: showTrial,
        upgradeURL: upgradeUrl
      }));
    }

    return this;
  }
});
