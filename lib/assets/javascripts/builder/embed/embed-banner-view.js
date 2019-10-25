var CoreView = require('backbone/core-view');
var template = require('./embed-banner.tpl');

const SIGN_UP_URL = 'https://carto.com/signup';
const REMOVE_BANNER_URL = 'https://carto.com/help/building-maps/remove-banner-from-map/';

var EmbedBannerView = CoreView.extend({

  className: 'CDB-Embed-banner--inner',

  events: {
    'click .js-close': '_close'
  },

  initialize: function () {
    this.template = template;
  },

  render: function () {
    this.$el.html(this.template({
      startNowUrl: this._getStartNowUrl(),
      removeBannerUrl: REMOVE_BANNER_URL
    }));
    return this;
  },

  _getStartNowUrl: function () {
    return SIGN_UP_URL +
    '?utm_source=embed' +
    '&utm_medium=referral' +
    '&utm_campaing=Free_Public_Map_Banner';
  },

  _close: function () {
    this.hide();
  }
});

module.exports = EmbedBannerView;
