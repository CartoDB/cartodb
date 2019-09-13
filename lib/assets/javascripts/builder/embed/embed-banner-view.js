var CoreView = require('backbone/core-view');
var template = require('./embed-banner.tpl');

const SIGN_UP_URL = 'https://carto.com/signup';
const REMOVE_BANNER_URL = 'https://carto.com/help';

var EmbedBannerView = CoreView.extend({

  className: 'CDB-Embed-banner--inner',

  initialize: function () {
    this.template = template;

    this._embedUrl = window.vizJSON.user.profile_url + '/builder/' + window.vizJSON.id + '/embed';

    this._startNowUrl = SIGN_UP_URL +
    '?utm_source=' + this._embedUrl +
    '&utm_medium=referral' +
    '&utm_campaing=Free_Public_Map_Banner';
    this._removeBannerUrl = REMOVE_BANNER_URL;
  },

  render: function () {
    this.$el.html(this.template({
      startNowUrl: this._startNowUrl,
      removeBannerUrl: this._removeBannerUrl
    }));
    return this;
  }
});

module.exports = EmbedBannerView;
