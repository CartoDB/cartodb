var CoreView = require('backbone/core-view');
var Utils = require('builder/helpers/utils');
var template = require('./twitter-import-details.tpl');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'modalModel'
];

/**
 *  When a Twitter import finishes, this dialog displays
 *  all the info about the price/cost etc.
 *
 */
module.exports = CoreView.extend({

  className: 'TwitterImportDetails',

  events: {
    'click .js-close': '_onCloseClick'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    var imp = this.model.get('import');
    var userTwitterValues = this._userModel.get('twitter');
    var availableTweets = userTwitterValues.quota - userTwitterValues.monthly_use;

    this.$el.html(
      template({
        datasetTotalRows: imp.tweets_georeferenced,
        datasetTotalRowsFormatted: Utils.formatNumber(imp.tweets_georeferenced),
        tweetsCost: imp.tweets_cost,
        tweetsCostFormatted: Utils.formatNumber(imp.tweets_cost),
        availableTweets: availableTweets,
        availableTweetsFormatted: Utils.formatNumber(availableTweets),
        tweetsOverquota: imp.tweets_overquota,
        tweetsOverquotaFormatted: Utils.formatNumber(imp.tweets_overquota),
        blockSizeFormatted: Utils.formatNumber(userTwitterValues.block_size),
        blockPriceFormatted: Utils.formatNumber(userTwitterValues.block_price)
      })
    );

    return this;
  },

  _onCloseClick: function () {
    this._modalModel.destroy();
  }
});
