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
  var userData = userModel.get(SERVICE_MAP[service].user) || {};

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
  run: function (userModel, isEnoughQuotaCallback) {
    if (isEnoughQuotaCallback) {
      AnalysesServicesQuota.isEnoughQuota(SERVICE_MAP.routing.api, function (isAllow, callback) {
        if (isAllow === true) {
          isEnoughQuotaCallback(parseQuota(userModel, 'routing'));
        } else {
          isEnoughQuotaCallback(false);
        }
      });
    } else {
      return parseQuota(userModel, 'routing');
    }
  }
};

var ANALYSES_WITH_QUOTA_MAP = {
  'trade-area': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.trade-area'),
    run: function (userModel, isEnoughQuotaCallback) {
      var service = 'isolines_provider';
      var provider = getProviderTypeByUser(service, userModel);

      if (!provider) {
        return isEnoughQuotaCallback ? isEnoughQuotaCallback(true) : false;
      }

      if (isEnoughQuotaCallback) {
        AnalysesServicesQuota.isEnoughQuota(SERVICE_MAP.isolines.api, function (isAllow) {
          if (isAllow === true) {
            isEnoughQuotaCallback(parseQuota(userModel, 'isolines'));
          } else {
            isEnoughQuotaCallback(false);
          }
        });
      } else {
        return parseQuota(userModel, 'isolines');
      }
    }
  },
  'georeference-street-address': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.georeference-street-address'),
    run: function (userModel, isEnoughQuotaCallback) {
      var service = 'geocoder_provider';
      var provider = getProviderTypeByUser(service, userModel);

      if (provider !== 'heremaps') {
        return isEnoughQuotaCallback ? isEnoughQuotaCallback(true) : false;
      }

      if (isEnoughQuotaCallback) {
        AnalysesServicesQuota.isEnoughQuota(SERVICE_MAP.geocoder.api, function (isAllow) {
          if (isAllow === true) {
            isEnoughQuotaCallback(parseQuota(userModel, 'geocoder'));
          } else {
            isEnoughQuotaCallback(false);
          }
        });
      } else {
        return parseQuota(userModel, 'geocoder');
      }
    }
  },
  'data-observatory-measure': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.data-observatory-measure'),
    run: function (userModel, isEnoughQuotaCallback) {
      if (isEnoughQuotaCallback) {
        AnalysesServicesQuota.isEnoughQuota(SERVICE_MAP.dataObservatory.api, function (isAllow) {
          if (isAllow === true) {
            isEnoughQuotaCallback(parseQuota(userModel, 'dataObservatory'));
          } else {
            isEnoughQuotaCallback(false);
          }
        });
      } else {
        return parseQuota(userModel, 'dataObservatory');
      }
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

  getQuotaInfo: function (type, userModel, callback) {
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      return ANALYSES_WITH_QUOTA_MAP[type].run(userModel, callback);
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
