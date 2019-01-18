var _ = require('underscore');

/**
 *  Control which analysis requires quota
 */

var unity = function (input) {
  return input;
};

var routingAnalysisQuota = {
  name: _t('editor.layers.analysis-form.quota.analysis-type.routing'),
  api: 'routing',
  user: 'mapzen_routing',
  needsQuota: true,
  transform: unity
};

var dataObservatoryQuota = {
  name: _t('editor.layers.analysis-form.quota.analysis-type.data-observatory-measure'),
  api: 'observatory',
  user: 'obs_general',
  needsQuota: true,
  transform: unity
};

var ANALYSES_WITH_QUOTA_MAP = {
  'trade-area': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.trade-area'),
    api: 'isolines',
    user: 'here_isolines',
    transform: function (input, formModel) {
      // the isoline analysis consume N rows x M tracts
      return input * formModel.get('isolines');
    },
    needsQuota: function (quotaInfo) {
      var info = quotaInfo.getService('isolines');
      var provider = info && info.get('provider');
      return !!provider;
    }
  },
  'georeference-street-address': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.georeference-street-address'),
    api: 'hires_geocoder',
    user: 'geocoding',
    transform: unity,
    needsQuota: function (quotaInfo) {
      var info = quotaInfo.getService('hires_geocoder');
      var provider = info && info.get('provider');
      return provider !== 'google';
    }
  },
  'georeference-city': {
    name: _t('editor.layers.analysis-form.quota.analysis-type.georeference-cities'),
    api: 'hires_geocoder',
    user: 'geocoding',
    transform: unity,
    needsQuota: function (quotaInfo) {
      var info = quotaInfo.getService('hires_geocoder');
      var provider = info && info.get('provider');
      return provider !== 'google';
    }
  },
  'data-observatory-measure': dataObservatoryQuota,
  'routing-sequential': routingAnalysisQuota,
  'routing-to-layer-all-to-all': routingAnalysisQuota,
  'routing-to-single-point': routingAnalysisQuota
};

module.exports = {
  requiresQuota: function (type, quotaInfo) {
    if (ANALYSES_WITH_QUOTA_MAP[type] !== undefined) {
      var needsQuota = ANALYSES_WITH_QUOTA_MAP[type].needsQuota;
      if (_.isFunction(needsQuota)) {
        return needsQuota(quotaInfo);
      } else {
        return needsQuota;
      }
    }
    return false;
  },

  transformInput: function (type, input, formModel) {
    if (ANALYSES_WITH_QUOTA_MAP[type] !== undefined) {
      var transform = ANALYSES_WITH_QUOTA_MAP[type].transform;
      return transform(input, formModel);
    }
    return input;
  },

  getAnalysisName: function (type) {
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      return ANALYSES_WITH_QUOTA_MAP[type].name;
    }
    return null;
  },

  getServiceName: function (type) {
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      return ANALYSES_WITH_QUOTA_MAP[type].api;
    }
    return null;
  },

  getUserDataName: function (type) {
    if (ANALYSES_WITH_QUOTA_MAP[type]) {
      return ANALYSES_WITH_QUOTA_MAP[type].user;
    }
    return null;
  }

};
