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
  tagName: 'footer',

  className: function () {
    let classes = 'CDB-Text CDB-FontSize-medium Footer';

    if (this.options && this.options.light) {
      classes += ' Footer--light';
    }

    return classes;
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(
      template({
        onpremiseVersion: this._configModel.get('onpremise_version'),
        isHosted: this._configModel.get('cartodb_com_hosted')
      })
    );

    return this;
  }
});
