var cdb = require('cartodb.js');

module.exports = {
  createDefaultVis: function () {
    return cdb.createVis(document.createElement('div'), {
      datasource: {
        maps_api_template: 'asd',
        user_name: 'pepe'
      },
      layers: [{type: 'torque'}]
    });
  }
};
