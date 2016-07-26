module.exports = {
  'georeference-country': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-admin-region': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-city': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-ip-address': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-long-lat': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-postal-code': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-street-address': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'data-observatory-measure': {
    template: require('./analyses/data-observatory-measure.tpl'),
    genericType: 'data-observatory-measure'
  },
  'filter-category': {
    template: require('./analyses/filter.tpl'),
    genericType: 'filter'
  },
  'filter-range': {
    template: require('./analyses/filter.tpl'),
    genericType: 'filter'
  },
  'centroid': {
    template: require('./analyses/centroid.tpl')
  },
  'weighted-centroid': {
    template: require('./analyses/centroid.tpl'),
    genericType: 'centroid'
  },
  'merge': {
    template: require('./analyses/merge.tpl')
  },
  'filter-by-node-column': {
    template: require('./analyses/filter-by-node-column.tpl')
  },
  'area-of-influence': {
    template: require('./analyses/area-of-influence.tpl')
  },
  'aggregate-intersection': {
    template: require('./analyses/aggregate-intersection.tpl')
  },
  'intersection': {
    template: require('./analyses/intersection.tpl')
  },
  'sampling': {
    template: require('./analyses/sampling.tpl')
  },
  'kmeans': {
    template: require('./analyses/kmeans.tpl')
  },
  'moran': {
    template: require('./analyses/moran.tpl')
  }
  'spatial-markov-trend': {
    template: require('./analyses/spatial-markov-trend.tpl')
  }
};
