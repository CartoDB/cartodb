var NotifierModel = require('../../../../../javascripts/cartodb3/components/notifier/notifier-model.js');

describe('components/notifier/notifier-model', function () {
  var model = new NotifierModel({}, {});

  describe('.getInfo', function () {
    model.updateInfo('< & Hello >');

    it('should escape HTML characters in getInfo', function () {
      var escapedInfo = model.getInfo();
      expect(escapedInfo).toBe('&lt; &amp; Hello &gt;');
    });
  });
});
