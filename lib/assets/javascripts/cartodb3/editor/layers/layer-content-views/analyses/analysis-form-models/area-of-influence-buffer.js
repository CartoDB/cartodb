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
  parse: function (nodeAttrs) {
    var formAttrs = _.extend({}, nodeAttrs);

    try {
      formAttrs.radius = DistanceConverter.toDistance(nodeAttrs.radius, nodeAttrs.distance);
      formAttrs.distance = nodeAttrs.distance;
    } catch (err) {
      formAttrs.radius = 100;
      formAttrs.distance = 'meters';
    }

    return formAttrs;
  },
  createSchema: function (formAttrs) {
    return {
      source: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.source'),
        options: [ formAttrs.source ],
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
  formatAttrs: function (formAttrs) {
    return _.defaults(
      {
        radius: DistanceConverter.toMeters(formAttrs.radius, formAttrs.distance)
      },
      formAttrs
    );
  }
};
