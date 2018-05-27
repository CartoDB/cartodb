const CoreView = require('backbone/core-view');
const template = require('./placeholder-item-view.tpl');
const AssetsVersion = require('dashboard/helpers/assets-version');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * Represents a map card on dashboard.
 */
module.exports = CoreView.extend({
  className: 'MapsList-item',
  tagName: 'li',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        assetsBase: this._configModel.get('app_assets_base_url'),
        assetsVersion: AssetsVersion.getAssetsVersion(),
        desc: this.model.get('short_description'),
        url: this.model.get('guide_url'),
        icon: this.model.get('icon')
      })
    );

    return this;
  }
});
