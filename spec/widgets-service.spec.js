var WidgetsService = require('../src/widgets-service');
var WidgetsCollection = require('../src/widgets/widgets-collection');

describe('widgets-service', function () {
  describe('get service singleton', function () {
    var widgetsCollection;

    beforeEach(function () {
      widgetsCollection = new WidgetsCollection();
    });

    it('should return the WidgetsService instance', function () {
      var instance = WidgetsService.getInstance(widgetsCollection);
      expect(instance).not.toBe(null);
    });

    it('should return the same WidgetsService instance', function () {
      var instanceA = WidgetsService.getInstance(widgetsCollection);
      expect(instanceA).not.toBe(null);
      var instanceB = WidgetsService.getInstance(widgetsCollection);
      expect(instanceB).not.toBe(null);
      expect(instanceA).toEqual(instanceB);
    });
  });
});
