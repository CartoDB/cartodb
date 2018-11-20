const moment = require('moment');
const CoreView = require('backbone/core-view');
const template = require('./deep-insights-item.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'routerModel',
  'userModel'
];

/**
 * Represents a map card on dashboard.
 */
module.exports = CoreView.extend({
  className: 'MapsList-item',
  tagName: 'li',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();
    const url = this.model.deepInsightsUrl(this.user);

    this.$el.html(
      template({
        url: url,
        title: this.model.get('title'),
        description: this.model.get('description'),
        timeDiff: moment(this.model.get('updated_at')).fromNow()
      })
    );

    return this;
  }
});
