var cdb = require('cartodb.js');

/**
 * Spec helper, to create a default vis object.
 * @return {Object} returns a vis instance
 */
module.exports = function () {
  return cdb.createVis(document.createElement('div'), {
    bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]],
    datasource: {
      maps_api_template: 'asd',
      user_name: 'pepe'
    },
    layers: [{type: 'torque'}]
  });
};
