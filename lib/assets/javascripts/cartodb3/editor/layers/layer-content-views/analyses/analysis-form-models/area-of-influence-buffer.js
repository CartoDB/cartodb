var _ = require('underscore');
var DistanceConverter = require('../../../../../value-objects/distance-converter');

module.exports = {
  type: 'buffer',
  label: _t('editor.layers.analysis-form.distance'),
  parametersDataFields: 'type,distance,radius',

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

  formatAttrs: function (formAttrs) {
    return _.defaults(
      {
        radius: DistanceConverter.toMeters(formAttrs.radius, formAttrs.distance)
      },
      formAttrs
    );
  }
};
