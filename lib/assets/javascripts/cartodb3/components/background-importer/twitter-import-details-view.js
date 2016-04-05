var Backbone = require('backbone');
// var BaseDialog = require('../../../views/base_dialog/view');
var Utils = require('cdb.Utils');
var template = require('./twitter-import-details.tpl');

/**
 *  When a Twitter import finishes, this dialog displays
 *  all the info about the price/cost etc.
 *
 */
module.exports = Backbone.View.extend({

  className: 'Dialog TwitterImportDetails is-opening',

  initialize: function () {
    this.elder('initialize');
    this.user = this.options.user;
  },

  render_content: function () {
    var imp = this.model.get('import');
    var userTwitterValues = this.user.get('twitter');
    var availableTweets = userTwitterValues.quota - userTwitterValues.monthly_use;
    var vis = this.model.importedVis();
    var url = vis && encodeURI(vis.viewUrl(this.user).edit()) || '';
    var d = {
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
    };
    return template(d);
  }
});
