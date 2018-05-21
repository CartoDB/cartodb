var ACTIVE_LOCALE = 'en';
var Locale = require('locale/index');
var Polyglot = require('node-polyglot');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
var _t = polyglot.t.bind(polyglot);

var MAP = {
  'aggregate-intersection': {
    title: _t('analyses.aggregate-intersection.short-title')
  },
  'bounding-box': {
    title: _t('analyses.bounding-box.short-title')
  },
  'bounding-circle': {
    title: _t('analyses.bounding-circle.short-title')
  },
  'buffer': {
    title: _t('analyses.area-of-influence.short-title')
  },
  'centroid': {
    title: _t('analyses.centroid.short-title')
  },
  'convex-hull': {
    title: _t('analyses.convex-hull.short-title')
  },
  'concave-hull': {
    title: _t('analyses.concave-hull.short-title')
  },
  'data-observatory-measure': {
    title: _t('analyses.data-observatory-measure.short-title')
  },
  'data-observatory-multiple-measures': {
    title: _t('analyses.data-observatory-multiple-measures.short-title')
  },
  'filter-by-node-column': {
    title: _t('analyses.filter-by-node-column.short-title')
  },
  'filter-category': {
    title: _t('analyses.filter.short-title')
  },
  'filter-range': {
    title: _t('analyses.filter.short-title')
  },
  'georeference-city': {
    title: _t('analyses.georeference.short-title')
  },
  'georeference-ip-address': {
    title: _t('analyses.georeference.short-title')
  },
  'georeference-country': {
    title: _t('analyses.georeference.short-title')
  },
  'georeference-long-lat': {
    title: _t('analyses.georeference.short-title')
  },
  'georeference-postal-code': {
    title: _t('analyses.georeference.short-title')
  },
  'georeference-street-address': {
    title: _t('analyses.georeference.short-title')
  },
  'georeference-admin-region': {
    title: _t('analyses.georeference.short-title')
  },
  'intersection': {
    title: _t('analyses.filter-intersection.short-title')
  },
  'kmeans': {
    title: _t('analyses.kmeans.short-title')
  },
  'line-to-single-point': {
    title: _t('analyses.connect-with-lines.short-title')
  },
  'line-source-to-target': {
    title: _t('analyses.connect-with-lines.short-title')
  },
  'line-sequential': {
    title: _t('analyses.connect-with-lines.short-title')
  },
  'merge': {
    title: _t('analyses.merge.short-title')
  },
  'moran': {
    title: _t('analyses.moran-cluster.short-title')
  },
  'routing-sequential': {
    title: _t('analyses.routing.short-title')
  },
  'routing-to-layer-all-to-all': {
    title: _t('analyses.routing.short-title')
  },
  'routing-to-single-point': {
    title: _t('analyses.routing.short-title')
  },
  'sampling': {
    title: _t('analyses.sampling.short-title')
  },
  'spatial-markov-trend': {
    title: _t('analyses.spatial-markov-trend.short-title')
  },
  'trade-area': {
    title: _t('analyses.area-of-influence.short-title')
  },
  'weighted-centroid': {
    title: _t('analyses.centroid.short-title')
  },
  'closest': {
    title: _t('analyses.find-nearest.short-title')
  },
  'deprecated-sql-function': {
    title: _t('analyses.deprecated-sql-function.short-title')
  }
};

var getAnalysisByType = function (type) {
  var safeType = type === '' ? 'unknown' : type;
  return MAP[safeType] || {
    title: _t('analyses.' + safeType)
  };
};

module.exports = {
  MAP: MAP,

  title: function (type) {
    return getAnalysisByType(type).title;
  }
};
