var Backbone = require('backbone');
var AnalysesQuotaEstimation = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-estimation-input');

describe('editor/layers/layer-content-view/analyses/analyses-quota/analyses-quota-estimation-input', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model({
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    AnalysesQuotaEstimation.init(configModel);
    this.successCallback = jasmine.createSpy('successCallback');
    this.errorCallback = jasmine.createSpy('errorCallback');
  });

  describe('requests', function () {
    beforeEach(function () {
      AnalysesQuotaEstimation.deferred = {
        state: function () {
          return 'pending';
        },
        promise: function () {
          return 'foo';
        }
      };
    });

    afterEach(function () {
      AnalysesQuotaEstimation.deferred = null;
    });

    it('should avoid multple request if executing', function () {
      spyOn(AnalysesQuotaEstimation.SQL, 'execute');
      AnalysesQuotaEstimation.fetch();
      expect(AnalysesQuotaEstimation.SQL.execute).not.toHaveBeenCalled();
    });
  });

  it('success', function () {
    spyOn(AnalysesQuotaEstimation.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [{ row_count: 3242 }]
      });
    });

    AnalysesQuotaEstimation.fetch().then(this.successCallback, this.errorCallback);
    expect(this.successCallback).toHaveBeenCalledWith(3242);
  });

  it('error', function () {
    spyOn(AnalysesQuotaEstimation.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.error({
        responseText: '{"error": ["foo"]}'
      });
    });

    AnalysesQuotaEstimation.fetch().then(this.successCallback, this.errorCallback);
    expect(this.errorCallback).toHaveBeenCalled();
    expect(this.successCallback).not.toHaveBeenCalled();
  });
});
