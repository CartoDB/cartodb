var Backbone = require('backbone');
var Utils = require('../../helpers/utils');
var template = require('./twitter-import-details.tpl');

/**
 *  When a Twitter import finishes, this dialog displays
 *  all the info about the price/cost etc.
 *
 */
module.exports = Backbone.View.extend({

  className: 'TwitterImportDetails is-opening',

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    this._userModel = opts.userModel;
  },

  render: function () {
    var imp = this.model.get('import');
    var vis = this.model.importedVis();

    var userTwitterValues = this._userModel.get('twitter');
    var availableTweets = userTwitterValues.quota - userTwitterValues.monthly_use;
    var url = vis && encodeURI(vis.viewUrl(this._userModel).edit()) || '';

    this.$el.html(
      template({
        type: vis && vis.get('type') === 'table' ? 'dataset' : 'map',
        mapURL: url,
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
  }
});
