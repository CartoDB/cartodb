var Backbone = require('backbone');
var AnalysesQuotaInfo = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-info');

describe('editor/layers/layer-content-view/analyses/analyses-quota/analyses-quota-info', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model({
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    this.quotaInfo = AnalysesQuotaInfo.get(configModel);
    spyOn(this.quotaInfo.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [
          { service: 'isolines', monthly_quota: 2000, used_quota: 23, soft_limit: false, provider: 'heremaps' },
          { service: 'hires_geocoder', monthly_quota: 1000, used_quota: 0, soft_limit: true, provider: 'mapzen' },
          { service: 'routing', monthly_quota: 1000, used_quota: 0, soft_limit: false, provider: 'mapzen' }
        ]
      });
    });

    this.successCallback = jasmine.createSpy('successCallback');
    this.errorCallback = jasmine.createSpy('errorCallback');
  });

  it('should fetch services', function () {
    this.quotaInfo.fetch({
      success: this.successCallback,
      error: this.errorCallback
    });

    expect(this.successCallback).toHaveBeenCalled();
    expect(this.quotaInfo.length).toBe(4);
  });

  it('should get service by name', function () {
    this.quotaInfo.fetch({
      success: this.successCallback,
      error: this.errorCallback
    });

    var isolines = this.quotaInfo.getService('isolines');
    expect(isolines.get('provider')).toBe('heremaps');
    expect(isolines.get('monthly_quota')).toBe(2000);
    expect(isolines.get('used_quota')).toBe(23);
  });

  it('should avoid multiple request if fetching', function () {
    spyOn(this.quotaInfo, 'isFetching').and.returnValue(true);
    this.quotaInfo.fetch({
      success: this.successCallback,
      error: this.errorCallback
    });

    expect(this.quotaInfo.SQL.execute).not.toHaveBeenCalled();
  });
});
