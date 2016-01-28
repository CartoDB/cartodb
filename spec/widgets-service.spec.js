var WidgetsService = require('../src/widgets-service');
var WidgetsCollection = require('../src/widgets/widgets-collection');

describe('widgets-service', function () {
  describe('get service singleton', function () {
    var widgetsCollection;
    var instance;

    beforeEach(function () {
      widgetsCollection = new WidgetsCollection();
      instance = new WidgetsService(widgetsCollection);
    });

    it('should return the WidgetsService instance', function () {
      expect(instance).not.toBe(null);
    });

  });
});
