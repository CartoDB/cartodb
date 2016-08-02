/**
 *  Control which analysis requires quota and provide
 *  enough info about it
 */

function getProviderTypeByUser (type, userModel) {
  if (userModel.isInsideOrg()) {
    var organizationModel = userModel._organizationModel;
    return organizationModel.get(type);
  } else {
    return userModel.get(type);
  }
}

var ANALYSES_WITH_QUOTA_MAP = {
  'trade-area': function (userModel) {
    var service = 'isolines_provider';
    var provider = getProviderTypeByUser(service, userModel);

    if (!provider || provider === 'mapzen') {
      return false;
    }

    var isolines = userModel.get('here_isolines') || {};
    return {
      totalQuota: isolines.quota || 0,
      usedQuota: isolines.monthly_use || 0,
      blockSize: isolines.block_size || 1000, /* There is no block size for isolines */
      blockPrice: isolines.block_price || 0,
      hardLimit: isolines.hard_limit !== undefined ? isolines.hard_limit : true
    };
  },
  'georeference-street-address': function (userModel) {
    var service = 'geocoder_provider';
    var provider = getProviderTypeByUser(service, userModel);

    if (provider !== 'heremaps') {
      return false;
    }

    var geocoding = userModel.get('geocoding') || {};
    return {
      totalQuota: geocoding.quota || 0,
      usedQuota: geocoding.monthly_use || 0,
      blockSize: geocoding.block_size || 1000,
      blockPrice: geocoding.block_price || 0,
      hardLimit: geocoding.hard_limit !== undefined ? geocoding.hard_limit : true
    };
  }
};

module.exports = {
  requiresQuota: function (type, userModel) {
    if (ANALYSES_WITH_QUOTA_MAP[type] !== undefined) {
      return ANALYSES_WITH_QUOTA_MAP[type](userModel) !== false;
    }
    return false;
  },

  hasQuota: function (type, userModel) {
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      var quotaInfo = ANALYSES_WITH_QUOTA_MAP[type](userModel);
      return quotaInfo.totalQuota > quotaInfo.usedQuota;
    }
    return false;
  },

  getQuotaInfo: function (type, userModel) {
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      return ANALYSES_WITH_QUOTA_MAP[type](userModel);
    }
    return false;
  }

};
