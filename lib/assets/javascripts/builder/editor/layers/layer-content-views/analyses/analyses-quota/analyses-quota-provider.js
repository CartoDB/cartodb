var _ = require('underscore');
var AnalysesQuotaOptions = require('./analyses-quota-options');
/**
 *  Provide info about quota
 *  It handles the source of data: api and user model
 */

var QUOTA_DEFAULTS = {
  totalQuota: 0,
  usedQuota: 0,
  blockSize: 1000,
  blockPrice: 0,
  enoughQuota: true
};

module.exports = function (type, userModel, quotaInfo, enoughQuota) {
  var apiData = quotaInfo.getService(AnalysesQuotaOptions.getServiceName(type)) || {};
  var userData = userModel.get(AnalysesQuotaOptions.getUserDataName(type)) || {};

  // Remove null | undefined | falsy values
  userData = _.pick(userData, _.identity);
  return _.defaults(
    {
      blockSize: userData.block_size,
      blockPrice: userData.block_price
    },
    {
      totalQuota: apiData.get('monthly_quota'),
      usedQuota: apiData.get('used_quota'),
      hardLimit: !apiData.get('soft_limit')
    },
    {
      enoughQuota: enoughQuota
    },
    QUOTA_DEFAULTS
  );
};
