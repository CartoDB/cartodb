var WidgetsService = require('../src/widgets-service');
var WidgetsCollection = require('../src/widgets/widgets-collection');

describe('widgets-service', function () {
  describe('get service singleton', function () {
    var widgetsCollection;
    var instance;

    beforeEach(function () {
      var vis = cdb.createVis(document.createElement('div'), {
        datasource: {
          maps_api_template: 'asd',
          user_name: 'pepe'
        },
        layers: [{type: 'torque'}]
      });
      widgetsCollection = new WidgetsCollection();
      instance = new WidgetsService(widgetsCollection, vis.dataviews);
    });

    it('should return the WidgetsService instance', function () {
      expect(instance).not.toBe(null);
    });

  });
});
