var CoreView = require('backbone/core-view');
var template = require('./embed-banner.tpl');

const SIGN_UP_URL = 'https://carto.com/signup';
const REMOVE_BANNER_URL = 'https://carto.com/help';

var EmbedBannerView = CoreView.extend({

  className: 'CDB-Embed-banner--inner',

  initialize: function (options) {
    // checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.template = template;

    this._baseUrl = window.baseUrl + '/builder/' + window.vizJSON.id + '/embed';

    this._startNowUrl = SIGN_UP_URL +
    '?utm_source=' + window.location.href +
    '&utm_medium=referral' +
    '&utm_campaing=Free_Public_Map_Banner';
    this._removeBannerUrl = REMOVE_BANNER_URL;
  },

  render: function () {
    this.$el.html(this.template({
      startNowUrl: this.startNowUrl,
      removeBannerUrl: this._removeBannerUrl
    }));
    return this;
  }
});

module.exports = EmbedBannerView;
