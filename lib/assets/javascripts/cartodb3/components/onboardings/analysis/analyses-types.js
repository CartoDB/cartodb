module.exports = {
  'filter-category': {
    template: require('./analyses/filter.tpl'),
    genericType: 'filter'
  },
  'filter-range': {
    template: require('./analyses/filter.tpl'),
    genericType: 'filter'
  },
  'moran': {
    template: require('./analyses/moran.tpl')
  },
  'data-observatory-measure': {
    template: require('./analyses/data-observatory-measure.tpl'),
    genericType: 'data-observatory-measure'
  },
  'centroid': {
    template: require('./analyses/centroid.tpl')
  },
  'weighted-centroid': {
    template: require('./analyses/centroid.tpl'),
    genericType: 'centroid'
  },
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
  }
};
