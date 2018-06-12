var MetricsTracker = require('builder/components/metrics/metrics-tracker.js');
var MetricsModel = require('builder/components/metrics/metrics-model.js');
var Backbone = require('backbone');

describe('components/metrics/metrics-tracker', function () {
  describe('.init', function () {
    it('should require userId and visId from the initialization', function () {
      expect(function () {
        MetricsTracker.init({ userId: 'user', visId: 'vis' });
      }).toThrowError('configModel is required');

      MetricsTracker.init({ userId: 'paco', visId: 'jasmine', configModel: 'whatever' });
      expect(MetricsTracker._userId).toBeDefined();
      expect(MetricsTracker._visId).toBeDefined();
      expect(MetricsTracker._configModel).toBeDefined();
    });
  });

  describe('.track', function () {
    beforeEach(function () {
      var configModel = new Backbone.Model();
      MetricsTracker.init({ userId: 'paco', visId: 'jasmine', configModel: configModel });
      spyOn(MetricsModel.prototype, 'save');
    });

    it('should check event name', function () {
      expect(function () {
        MetricsTracker.track();
      }).toThrowError('eventName is required');
    });

    it('should save metric model', function () {
      MetricsTracker.track('eventExample');
      expect(MetricsModel.prototype.save).toHaveBeenCalled();
    });
  });
});
