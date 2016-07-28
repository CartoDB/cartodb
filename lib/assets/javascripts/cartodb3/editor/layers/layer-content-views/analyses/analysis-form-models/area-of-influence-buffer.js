var _ = require('underscore');
var DistanceConverter = require('../../../../../value-objects/distance-converter');

var DEFAULT_DISTANCE = 'meters';

module.exports = {
  type: 'buffer',
  label: _t('editor.layers.analysis-form.distance'),
  parametersDataFields: 'type,distance,radius,dissolved',

  parse: function (nodeAttrs) {
    var formAttrs = _.extend({}, nodeAttrs);

    try {
      formAttrs.radius = DistanceConverter.toDistance(nodeAttrs.radius, nodeAttrs.distance);
      formAttrs.distance = nodeAttrs.distance || DEFAULT_DISTANCE;
      formAttrs.dissolved = nodeAttrs.dissolved === undefined ? false : nodeAttrs.dissolved;
    } catch (err) {
      formAttrs.radius = 100;
      formAttrs.distance = DEFAULT_DISTANCE;
      formAttrs.dissolved = false;
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
