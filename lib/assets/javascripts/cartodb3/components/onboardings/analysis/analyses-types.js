module.exports = {
  'georeference-country': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference',
    style: true
  },
  'georeference-admin-region': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference',
    style: true
  },
  'georeference-city': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference',
    style: true
  },
  'georeference-ip-address': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference',
    style: true
  },
  'georeference-long-lat': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference',
    style: true
  },
  'georeference-postal-code': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference',
    style: true
  },
  'georeference-street-address': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference',
    style: true
  },
  'data-observatory-measure': {
    template: require('./analyses/data-observatory-measure.tpl'),
    genericType: 'data-observatory-measure',
    style: true
  },
  'filter-category': {
    template: require('./analyses/filter.tpl'),
    genericType: 'filter',
    style: true
  },
  'filter-range': {
    template: require('./analyses/filter.tpl'),
    genericType: 'filter',
    style: true
  },
  'centroid': {
    template: require('./analyses/centroid.tpl'),
    style: true
  },
  'weighted-centroid': {
    template: require('./analyses/centroid.tpl'),
    genericType: 'centroid',
    style: true
  },
  'merge': {
    template: require('./analyses/merge.tpl'),
    style: true
  },
  'filter-by-node-column': {
    template: require('./analyses/filter-by-node-column.tpl')
  },
  'trade-area': {
    template: require('./analyses/area-of-influence.tpl'),
    genericType: 'area-of-influence',
    style: true
  },
  'buffer': {
    template: require('./analyses/area-of-influence.tpl'),
    genericType: 'area-of-influence',
    style: true
  },
  'aggregate-intersection': {
    template: require('./analyses/aggregate-intersection.tpl'),
    style: true
  },
  'intersection': {
    template: require('./analyses/intersection.tpl'),
    style: true
  },
  'sampling': {
    template: require('./analyses/sampling.tpl'),
    style: true
  },
  'kmeans': {
    template: require('./analyses/kmeans.tpl'),
    style: true
  },
  'moran': {
    template: require('./analyses/moran.tpl'),
    style: true
  },
  'spatial-markov-trend': {
    template: require('./analyses/spatial-markov-trend.tpl'),
    style: true
  }
};
