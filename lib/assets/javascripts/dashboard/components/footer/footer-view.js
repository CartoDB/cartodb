const CoreView = require('backbone/core-view');
const template = require('./footer.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 *  Decide what support block app should show
 */

module.exports = CoreView.extend({
  className: 'CDB-Text CDB-FontSize-medium u-tSpace-xl Footer',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(
      template({
        onpremiseVersion: this._configModel.get('onpremise_version'),
        isHosted: this._configModel.get('cartodb_com_hosted'),
        light: false
      })
    );

    return this;
  }
});
