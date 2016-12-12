var CoreView = require('backbone/core-view');
var Utils = require('../../helpers/utils');
var template = require('./twitter-import-details.tpl');

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

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    this._userModel = opts.userModel;
    this._modalModel = opts.modalModel;
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
