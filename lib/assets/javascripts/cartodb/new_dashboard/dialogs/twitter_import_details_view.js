var $ = require('jquery');
var cdb = require('cartodb.js');
var BaseDialog = require('../../new_common/views/base_dialog/view');
var Utils = require('cdb.Utils');

/** 
 *  When a Twitter import finishes, this dialog displays
 *  all the info about the price/cost etc.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog TwitterImportDetails is-opening',

  initialize: function() {
    this.elder('initialize');
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_dashboard/views/twitter_import_details');
  },

  render_content: function() {
    var imp = this.model.get('import');
    var userTwitterValues = this.user.get('twitter');
    var availableTweets = userTwitterValues.quota - userTwitterValues.monthly_use;
    var d = {
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
    return this.template(d);
  }

});