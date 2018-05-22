const CoreView = require('backbone/core-view');
const template = require('./placeholder-item-view.tpl');
const AssetsVersion = require('dashboard/helpers/assets-version');

/**
 * Represents a map card on dashboard.
 */
module.exports = CoreView.extend({
  className: 'MapsList-item',
  tagName: 'li',

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        assetsVersion: AssetsVersion.getAssetsVersion(),
        desc: this.model.get('short_description'),
        url: this.model.get('guide_url'),
        icon: this.model.get('icon')
      })
    );

    return this;
  }
});
