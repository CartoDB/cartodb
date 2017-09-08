var CoreView = require('backbone/core-view');
var template = require('./upgrade-dialog.tpl');
var _ = require('underscore');

var REQUIRED_OPTS = [
  'userModel',
  'configModel'
];

module.exports = CoreView.extend({
  className: 'CDB-DrdopdownContainer Editor-boxModal Privacy-dialog',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    // var upgradeUrl = this._configModel.get('upgrade_url');
    // var showTrial = this._userModel.canStartTrial();

    var upgradeUrl = 'https://elenatorro.com';
    var showTrial = true;

    this.$el.empty();
    this.$el.html(template({
      upgradeURL: upgradeUrl,
      showTrial: showTrial
    }));

    return this;
  }
});
