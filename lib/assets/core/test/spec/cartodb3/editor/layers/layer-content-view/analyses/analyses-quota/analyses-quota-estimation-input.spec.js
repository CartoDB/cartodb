var Backbone = require('backbone');
var AnalysesQuotaEstimation = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-estimation-input');
var cdb = require('cartodb.js');

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
      spyOn(cdb.SQL.prototype, 'execute');
      AnalysesQuotaEstimation.fetch();
      expect(cdb.SQL.prototype.execute).not.toHaveBeenCalled();
    });
  });

  it('success', function () {
    cdb.SQL.prototype.execute = function (query, vars, params) {
      params && params.success({
        rows: [{'QUERY PLAN': 'Seq Scan on paradas_metro_madrid (cost=0.00..6.97 rows=325 width=108)'}]
      });
    };

    AnalysesQuotaEstimation.fetch().then(this.successCallback, this.errorCallback);
    expect(this.successCallback).toHaveBeenCalledWith('325');
  });

  it('error', function () {
    cdb.SQL.prototype.execute = function (query, vars, params) {
      params && params.error({
        responseText: '{"error": ["foo"]}'
      });
    };

    AnalysesQuotaEstimation.fetch().then(this.successCallback, this.errorCallback);
    expect(this.errorCallback).toHaveBeenCalled();
    expect(this.successCallback).not.toHaveBeenCalled();
  });
});

