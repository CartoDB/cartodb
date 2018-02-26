var Backbone = require('backbone');
var AnalysesQuotaEnough = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-enough');

describe('editor/layers/layer-content-view/analyses/analyses-quota/analyses-quota-enough', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model({
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    AnalysesQuotaEnough.init(configModel);
    this.successCallback = jasmine.createSpy('successCallback');
    this.errorCallback = jasmine.createSpy('errorCallback');
  });

  describe('requests', function () {
    beforeEach(function () {
      AnalysesQuotaEnough.deferred = {
        state: function () {
          return 'pending';
        },
        promise: function () {
          return 'foo';
        }
      };
    });

    afterEach(function () {
      AnalysesQuotaEnough.deferred = null;
    });

    it('should avoid multple request if executing', function () {
      spyOn(AnalysesQuotaEnough.SQL, 'execute');
      AnalysesQuotaEnough.fetch();
      expect(AnalysesQuotaEnough.SQL.execute).not.toHaveBeenCalled();
    });
  });

  it('not enough quota', function () {
    spyOn(AnalysesQuotaEnough.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [{ 'cdb_enough_quota': false }]
      });
    });

    AnalysesQuotaEnough.fetch().then(this.successCallback, this.errorCallback);
    expect(this.successCallback).toHaveBeenCalledWith(false);
  });

  it('enough quota', function () {
    spyOn(AnalysesQuotaEnough.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [{ 'cdb_enough_quota': true }]
      });
    });

    AnalysesQuotaEnough.fetch().then(this.successCallback, this.errorCallback);
    expect(this.successCallback).toHaveBeenCalledWith(true);
  });

  it('error', function () {
    spyOn(AnalysesQuotaEnough.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.error({
        responseText: '{"error": ["foo"]}'
      });
    });

    AnalysesQuotaEnough.fetch().then(this.successCallback, this.errorCallback);
    expect(this.errorCallback).toHaveBeenCalled();
    expect(this.successCallback).not.toHaveBeenCalled();
  });
});
