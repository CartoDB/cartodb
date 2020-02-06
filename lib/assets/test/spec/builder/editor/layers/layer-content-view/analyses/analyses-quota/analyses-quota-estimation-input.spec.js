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
  });

  it('success', function (done) {
    spyOn(AnalysesQuotaEstimation.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [{ row_count: 3242 }]
      });
    });

    AnalysesQuotaEstimation.fetch().then(function(data) {
      expect(data).toEqual(3242);
      done();
    });
  });

  it('error', function (done) {
    spyOn(AnalysesQuotaEstimation.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.error({
        responseText: '{"error": ["foo"]}'
      });
    });

    AnalysesQuotaEstimation.fetch().catch(function(error) {
      expect(error).toEqual('foo');
      done();
    });
  });
});
