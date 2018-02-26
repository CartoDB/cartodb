var Backbone = require('backbone');
var AnalysesQuotaOptions = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-options');
var AnalysesQuotaInfo = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-info');

describe('editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-options', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model({
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    this.quotaInfo = AnalysesQuotaInfo.get(configModel);
    this.quotaInfo.reset([
      {service: 'isolines', monthly_quota: 2000, used_quota: 23, soft_limit: false, provider: 'heremaps'},
      {service: 'hires_geocoder', monthly_quota: 1000, used_quota: 0, soft_limit: true, provider: 'heremaps'},
      {service: 'routing', monthly_quota: 1000, used_quota: 0, soft_limit: false, provider: 'mapzen'},
      {service: 'observatory', monthly_quota: 1000, used_quota: 0, soft_limit: false, provider: 'data observatory'}
    ]);
  });

  describe('requiresQuota', function () {
    it('analysis does not require quota', function () {
      expect(AnalysesQuotaOptions.requiresQuota('foo', this.quotaInfo)).toBe(false);
    });

    it('routing or data observatory', function () {
      expect(AnalysesQuotaOptions.requiresQuota('routing-sequential', this.quotaInfo)).toBe(true);
      expect(AnalysesQuotaOptions.requiresQuota('data-observatory-measure', this.quotaInfo)).toBe(true);
    });

    it('data observatory multiple should NOT require quota', function () {
      expect(AnalysesQuotaOptions.requiresQuota('data-observatory-multiple-measures', this.quotaInfo)).toBeFalsy();
    });

    describe('trade-area', function () {
      it('should require quota if provider is set', function () {
        var geocoder = this.quotaInfo.getService('hires_geocoder');
        expect(AnalysesQuotaOptions.requiresQuota('trade-area', this.quotaInfo)).toBeTruthy();
        geocoder.set('provider', 'mapzen');
        expect(AnalysesQuotaOptions.requiresQuota('trade-area', this.quotaInfo)).toBeTruthy();
      });

      it('should not require quota when provider is empty', function () {
        var isolines = this.quotaInfo.getService('isolines');
        expect(AnalysesQuotaOptions.requiresQuota('trade-area', this.quotaInfo)).toBeTruthy();
        isolines.set('provider', null);
        expect(AnalysesQuotaOptions.requiresQuota('trade-area', this.quotaInfo)).toBeFalsy();
      });
    });

    describe('georeference-street-address', function () {
      it('should return quota if provider is not google', function () {
        expect(AnalysesQuotaOptions.requiresQuota('georeference-street-address', this.quotaInfo)).toBeTruthy();
      });

      it('should not return quota if provider is google', function () {
        var serviceModel = this.quotaInfo.at(1);
        serviceModel.set('provider', 'google');
        expect(AnalysesQuotaOptions.requiresQuota('georeference-street-address', this.quotaInfo)).toBeFalsy();
      });
    });

    describe('georeference-city', function () {
      it('should return quota if provider is not google', function () {
        expect(AnalysesQuotaOptions.requiresQuota('georeference-city', this.quotaInfo)).toBeTruthy();
      });

      it('should not return quota if provider is google', function () {
        var serviceModel = this.quotaInfo.at(1);
        serviceModel.set('provider', 'google');
        expect(AnalysesQuotaOptions.requiresQuota('georeference-city', this.quotaInfo)).toBeFalsy();
      });
    });
  });

  describe('transform input', function () {
    it('should return same input for analysis without quota', function () {
      expect(AnalysesQuotaOptions.transformInput('foo', 20, {})).toBe(20);
    });

    it('should return same input for analysis with quota', function () {
      var formModel = new Backbone.Model({
        measurements: [1, 2]
      });

      expect(AnalysesQuotaOptions.transformInput('georeference-street-address', 20, {})).toBe(20);
      expect(AnalysesQuotaOptions.transformInput('data-observatory-measure', 15, formModel)).toBe(15);
    });

    it('should return input multiplied for tracts for isolines', function () {
      var formModel = new Backbone.Model({
        isolines: 1
      });

      expect(AnalysesQuotaOptions.transformInput('trade-area', 20, formModel)).toBe(20);
      formModel.set('isolines', 2);
      expect(AnalysesQuotaOptions.transformInput('trade-area', 20, formModel)).toBe(40);
      formModel.set('isolines', 10);
      expect(AnalysesQuotaOptions.transformInput('trade-area', 20, formModel)).toBe(200);
    });
  });

  it('getAnalysisName', function () {
    expect(AnalysesQuotaOptions.getAnalysisName('foo')).toBe(null);
    expect(AnalysesQuotaOptions.getAnalysisName('trade-area')).toBe('editor.layers.analysis-form.quota.analysis-type.trade-area');
    expect(AnalysesQuotaOptions.getAnalysisName('data-observatory-measure')).toBe('editor.layers.analysis-form.quota.analysis-type.data-observatory-measure');
  });

  it('getServiceName', function () {
    expect(AnalysesQuotaOptions.getServiceName('foo')).toBe(null);
    expect(AnalysesQuotaOptions.getServiceName('trade-area')).toBe('isolines');
    expect(AnalysesQuotaOptions.getServiceName('data-observatory-measure')).toBe('observatory');
  });

  it('getUserDataName', function () {
    expect(AnalysesQuotaOptions.getUserDataName('foo')).toBe(null);
    expect(AnalysesQuotaOptions.getUserDataName('trade-area')).toBe('here_isolines');
    expect(AnalysesQuotaOptions.getUserDataName('data-observatory-measure')).toBe('obs_general');
  });
});
