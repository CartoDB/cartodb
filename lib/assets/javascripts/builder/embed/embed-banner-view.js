var CoreView = require('backbone/core-view');
var template = require('./embed-banner.tpl');

const SIGN_UP_URL = 'https://carto.com/signup';
const REMOVE_BANNER_URL = 'https://carto.com/help/building-maps/remove-banner-from-map/';

var EmbedBannerView = CoreView.extend({

  className: 'CDB-Embed-banner--inner',

  initialize: function () {
    this.template = template;

    this._ownerData = window.ownerData;
    this._viz = window.vizJSON;
  },

  render: function () {
    this.$el.html(this.template({
      startNowUrl: this._getStartNowUrl(),
      removeBannerUrl: REMOVE_BANNER_URL
    }));
    return this;
  },

  _getEmbedUrl: function () {
    return this._ownerData.base_url + '/builder/' + this._viz.id + '/embed';
  },

  _getStartNowUrl: function () {
    return SIGN_UP_URL +
    '?utm_source=' + this._getEmbedUrl() +
    '&utm_medium=referral' +
    '&utm_campaing=Free_Public_Map_Banner';
  }
});

module.exports = EmbedBannerView;
