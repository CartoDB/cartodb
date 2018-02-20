var MetricsModel = require('builder/components/metrics/metrics-model.js');
var ConfigModel = require('builder/data/config-model');

describe('components/metrics/metrics-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/paco'
    });

    this.metricModel = new MetricsModel({
      eventName: 'event-name',
      eventProperties: { property: 'event-property-1' }
    }, {
      userId: 'paco',
      visId: '1234',
      configModel: configModel
    });
  });

  it('should create url correctly', function () {
    expect(this.metricModel.url()).toBe('/u/paco/api/v3/metrics');
  });

  it('should have eventName defined', function () {
    expect(this.metricModel.get('eventName')).toBe('event-name');
  });

  it('should have necessary options', function () {
    expect(this.metricModel._userId).toBeDefined();
    expect(this.metricModel._visId).toBeDefined();
    expect(this.metricModel._configModel).toBeDefined();
  });

  describe('.toJSON', function () {
    it('should define correctly the json structure', function () {
      expect(this.metricModel.toJSON()).toEqual(
        jasmine.objectContaining({
          name: 'event-name',
          properties: {
            property: 'event-property-1',
            visualization_id: '1234',
            user_id: 'paco'
          }
        })
      );
    });
  });
});
