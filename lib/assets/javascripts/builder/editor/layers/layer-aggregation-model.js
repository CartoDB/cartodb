var Backbone = require('backbone');

/**
 *  Aggregation Model
 */

var PLACEMENTS = {
  centroid: 'centroid',
  grid: 'point-grid',
  sample: 'point-sample'
};

module.exports = Backbone.Model.extend({
  defaults: {
    threshold: 100000,
    resolution: 1,
    placement: PLACEMENTS.sample
  }
});
