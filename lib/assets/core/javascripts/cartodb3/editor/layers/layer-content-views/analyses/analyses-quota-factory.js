var _ = require('underscore');

/**
 *  Control which analysis requires quota and provide
 *  enough info about it
 */

var QUOTA_DEFAULTS = {
  totalQuota: 0,
  usedQuota: 0,
  blockSize: 1000,
  blockPrice: 0
};

function parseQuota (data) {
  // Remove null | undefined | falsy values
  data = data || {};
  data = _.pick(data, _.identity);
  return _.defaults(
    {
      totalQuota: data.quota,
      usedQuota: data.monthly_use,
      blockSize: data.block_size,
      blockPrice: data.block_price,
      hardLimit: data.hard_limit !== undefined ? data.hard_limit : true
    },
    QUOTA_DEFAULTS
  );
}

function getProviderTypeByUser (type, userModel) {
  var organizationModel;
  if (userModel.isInsideOrg()) {
    organizationModel = userModel.getOrganization();
    return organizationModel.get(type);
  } else {
    return userModel.get(type);
  }
}

var routingAnalysisQuota = {
  name: _t('editor.layers.analysis-form.quota.analysis-type.routing'),
  run: function (userModel) {
    var routing = userModel.get('mapzen_routing');
    return parseQuota(routing);
  }
};

var ANALYSES_WITH_QUOTA_MAP = {
  'trade-area': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.trade-area'),
    run: function (userModel) {
      var service = 'isolines_provider';
      var provider = getProviderTypeByUser(service, userModel);
      var isolines = userModel.get('here_isolines');

      if (!provider || provider === 'mapzen') {
        return false;
      }

      return parseQuota(isolines);
    }
  },
  'georeference-street-address': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.georeference-street-address'),
    run: function (userModel) {
      var service = 'geocoder_provider';
      var provider = getProviderTypeByUser(service, userModel);
      var geocoding = userModel.get('geocoding');

      if (provider !== 'heremaps') {
        return false;
      }

      return parseQuota(geocoding);
    }
  },
  'data-observatory-measure': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.data-observatory-measure'),
    run: function (userModel) {
      var obsGeneral = userModel.get('obs_general');
      return parseQuota(obsGeneral);
    }
  },
  'routing-sequential': routingAnalysisQuota,
  'routing-to-layer-all-to-all': routingAnalysisQuota,
  'routing-to-single-point': routingAnalysisQuota
};

module.exports = {
  requiresQuota: function (type, userModel) {
    if (ANALYSES_WITH_QUOTA_MAP[type] !== undefined) {
      return ANALYSES_WITH_QUOTA_MAP[type].run(userModel) !== false;
    }
    return false;
  },

  hasQuota: function (type, userModel) {
    var quotaInfo;
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      quotaInfo = ANALYSES_WITH_QUOTA_MAP[type].run(userModel);
      return quotaInfo.totalQuota > quotaInfo.usedQuota;
    }
    return false;
  },

  getQuotaInfo: function (type, userModel) {
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      return ANALYSES_WITH_QUOTA_MAP[type].run(userModel);
    }
    return false;
  },

  getAnalysisName: function (type) {
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      return ANALYSES_WITH_QUOTA_MAP[type].name;
    }
    return null;
  }

};
