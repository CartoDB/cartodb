var _ = require('underscore');
var AnalysesServicesQuota = require('../../../../data/analyses-services-quota');

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

var SERVICE_MAP = {
  routing: {
    user: 'mapzen_routing',
    api: 'routing'
  },
  isolines: {
    user: 'here_isolines',
    api: 'isolines'
  },
  geocoder: {
    user: 'geocoding',
    api: 'hires_geocoder'
  },
  dataObservatory: {
    user: 'obs_general',
    api: 'observatory'
  }
};

function parseQuota (userModel, service) {
  var apiData = AnalysesServicesQuota.getServiceQuota(SERVICE_MAP[service].api);
  var userData = userModel.get(SERVICE_MAP[service].user);

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
  run: function (userModel, callback) {
    AnalysesServicesQuota.isEnoughQuota(SERVICE_MAP.routing.api, function (isAllow) {
      if (isAllow === true) {
        callback(parseQuota(userModel, 'routing'));
      } else {
        callback(false);
      }
    });
  }
};

var ANALYSES_WITH_QUOTA_MAP = {
  'trade-area': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.trade-area'),
    run: function (userModel, callback) {
      var service = 'isolines_provider';
      var provider = getProviderTypeByUser(service, userModel);

      if (!provider) {
        return false;
      }

      AnalysesServicesQuota.isEnoughQuota(SERVICE_MAP[service].api, function (isAllow) {
        if (isAllow === true) {
          callback(parseQuota(userModel, 'isolines'));
        } else {
          callback(false);
        }
      });
    }
  },
  'georeference-street-address': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.georeference-street-address'),
    run: function (userModel, callback) {
      var service = 'geocoder_provider';
      var provider = getProviderTypeByUser(service, userModel);

      if (provider !== 'heremaps') {
        return false;
      }

      AnalysesServicesQuota.isEnoughQuota(SERVICE_MAP[service].api, function (isAllow) {
        if (isAllow === true) {
          callback(parseQuota(userModel, 'geocoder'));
        } else {
          callback(false);
        }
      });
    }
  },
  'data-observatory-measure': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.data-observatory-measure'),
    run: function (userModel, callback) {
      AnalysesServicesQuota.isEnoughQuota(SERVICE_MAP.dataObservatory.api, function (isAllow) {
        if (isAllow === true) {
          callback(parseQuota(userModel, 'dataObservatory'));
        } else {
          callback(false);
        }
      });
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

  getQuotaInfo: function (type, userModel, callback) {
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      ANALYSES_WITH_QUOTA_MAP[type].run(userModel, callback);
    }
    callback(false);
  },

  getAnalysisName: function (type) {
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      return ANALYSES_WITH_QUOTA_MAP[type].name;
    }
    return null;
  }

};
