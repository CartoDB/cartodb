var _ = require('underscore');
var DistanceConverter = require('builder/value-objects/distance-converter');

var DEFAULT_DISTANCE = 'meters';

module.exports = {
  type: 'buffer',
  label: _t('editor.layers.analysis-form.distance'),
  parametersDataFields: 'type,distance,radius,isolines,dissolved',

  parse: function (nodeAttrs) {
    var formAttrs = _.extend({}, nodeAttrs);

    try {
      formAttrs.radius = DistanceConverter.toDistance(nodeAttrs.radius, nodeAttrs.distance);
      formAttrs.distance = nodeAttrs.distance || DEFAULT_DISTANCE;
      formAttrs.dissolved = nodeAttrs.dissolved === undefined ? false : nodeAttrs.dissolved;
      formAttrs.isolines = nodeAttrs.isolines || 1;
    } catch (err) {
      formAttrs.radius = 100;
      formAttrs.isolines = 1;
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
