var cdb = require('cartodb.js');

module.exports = {
  createDefaultVis: function () {
    return cdb.createVis(document.createElement('div'), {
      bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]],
      datasource: {
        maps_api_template: 'asd',
        user_name: 'pepe'
      },
      layers: [
        {
          id: 'layer1',
          type: 'cartodb',
          options: {
            source: 'a0',
            cartocss: '#layer { polygon-fill: #CDCDCD; }'
          }
        }, {
          id: 'layer2',
          type: 'torque',
          options: {
            source: 'a0',
            cartocss: '#layer { polygon-fill: #CDCDCD; }'
          }
        }
      ],
      analyses: [
        {
          id: 'a0',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo;'
          }
        }
      ]
    });
  }
};
