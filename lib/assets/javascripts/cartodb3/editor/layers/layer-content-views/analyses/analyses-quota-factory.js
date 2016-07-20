/**
 *  Control which analysis requires quota and provide
 *  enough info about it
 */

function getIsolinesQuota (userModel) {
  var isolines = userModel.get('here_isolines') || {};
  return {
    totalQuota: isolines.quota,
    usedQuota: isolines.monthly_use,
    blockSize: 1000, /* There is no block size for isolines */
    blockPrice: isolines.block_price || 0,
    hardLimit: isolines.hard_limit
  };
}

var ANALYSES_WITH_QUOTA_MAP = {
  'trade-area': function (userModel) {
    return getIsolinesQuota(userModel);
  }
};

module.exports = {
  requiresQuota: function (type) {
    return !!ANALYSES_WITH_QUOTA_MAP[type];
  },

  hasQuota: function (type) {
    var quotaInfo = ANALYSES_WITH_QUOTA_MAP[type];
    return quotaInfo.totalQuota > quotaInfo.usedQuota;
  },

  getQuotaInfo: function (type, userModel) {
    return ANALYSES_WITH_QUOTA_MAP[type](userModel);
  }

};
