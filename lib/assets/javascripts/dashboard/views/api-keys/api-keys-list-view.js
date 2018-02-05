const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const template = require('./api-keys-list.tpl');

const REQUIRED_OPTS = [];

module.exports = CoreView.extend({
  events: {},

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    return this.$el.html(
      template()
    );
  }
});
