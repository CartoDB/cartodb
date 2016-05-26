var _ = require('underscore');
var DistanceConverter = require('../../../../../value-objects/distance-converter');

var distanceLabel = function (distance) {
  switch (distance) {
    case 'meters':
      return _t('editor.layers.analysis-form.meters');
    case 'kilometers':
      return _t('editor.layers.analysis-form.kilometers');
    case 'miles':
      return _t('editor.layers.analysis-form.miles');
    default:
      return '';
  }
};

module.exports = {
  templateData: {
    parametersDataFields: 'type,distance,radius'
  },
  parse: function (attrs) {
    var parsedAttrs = {type: 'buffer'};

    try {
      parsedAttrs.radius = DistanceConverter.toDistance(attrs.radius, attrs.distance);
      parsedAttrs.distance = attrs.distance;
    } catch (err) {
      parsedAttrs.radius = 100;
      parsedAttrs.distance = 'meters';
    }

    return parsedAttrs;
  },
  createSchema: function (attrs) {
    return {
      source: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.source'),
        options: [ attrs.source ],
        editorAttrs: { disabled: true }
      },
      type: {
        type: 'Radio',
        text: _t('editor.layers.analysis-form.type'),
        options: [
          {
            val: 'buffer',
            label: _t('editor.layers.analysis-form.distance')
          }, {
            val: 'trade-area',
            label: _t('editor.layers.analysis-form.time')
          }
        ]
      },
      distance: {
        type: 'Radio',
        text: _t('editor.layers.analysis-form.distance'),
        options: _.map(DistanceConverter.OPTIONS, function (d) {
          return {
            val: d.distance,
            label: distanceLabel(d.distance)
          };
        })
      },
      radius: {
        type: 'Number',
        label: _t('editor.layers.analysis-form.radius'),
        validators: ['required', {
          type: 'interval',
          min: 1,
          max: 100
        }]
      }
    };
  },
  toNodeAttrs: function (attrs) {
    return _.defaults(
      {
        radius: DistanceConverter.toMeters(attrs.radius, attrs.distance)
      },
      attrs, 'distance'
    );
  }
};
