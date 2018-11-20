const CoreView = require('backbone/core-view');
const template = require('./mamufas-import-dialog.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

/**
 *  Dialog for drop actions using mamufas
 *
 */

const REQUIRED_OPTS = [
  'modalModel'
];

module.exports = CoreView.extend({
  className: 'Dialog-contentWrapper MamufasDialog',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$('.Dialog-content').addClass('Dialog-content--expanded');
    this.$el.append(template());
    return this;
  }
});
