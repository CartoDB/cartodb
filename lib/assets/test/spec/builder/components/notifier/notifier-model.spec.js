var NotifierModel = require('builder/components/notifier/notifier-model.js');

describe('components/notifier/notifier-model', function () {
  var model = new NotifierModel({}, {});

  describe('.getInfo', function () {
    model.updateInfo('< & Hello >');

    it('should return current info', function () {
      var info = model.getInfo();
      expect(info).toBe('< & Hello >');
    });
  });
});
