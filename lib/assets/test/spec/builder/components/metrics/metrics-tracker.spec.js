var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var MetricsTypes = require('builder/components/metrics/metrics-types');
var MetricsModel = require('builder/components/metrics/metrics-model');
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

    it('should check event name is present', function () {
      expect(function () {
        MetricsTracker.track();
      }).toThrowError('eventName is required');
    });

    it('should check event name is available', function () {
      expect(function () {
        MetricsTracker.track('MADE_UP_METRIC');
      }).toThrowError('"MADE_UP_METRIC" is not an allowed event type');
    });

    it('should save metric model', function () {
      var WHATEVER = MetricsTypes.STYLED_BY_VALUE;
      MetricsTracker.track(WHATEVER);
      expect(MetricsModel.prototype.save).toHaveBeenCalled();
    });
  });
});
