var Backbone = require('backbone');
var AnalysesQuotaEnough = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-enough');

describe('editor/layers/layer-content-view/analyses/analyses-quota/analyses-quota-enough', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^/u/pepe')).andReturn({
      status: 200
    });

    var configModel = new Backbone.Model({
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    AnalysesQuotaEnough.init(configModel);
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('not enough quota', function (done) {
    spyOn(AnalysesQuotaEnough.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [{ 'cdb_enough_quota': false }]
      });
    });

    AnalysesQuotaEnough.fetch()
      .then(function (data) {
        expect(data).toEqual(false);
        done();
      });
  });

  it('enough quota', function (done) {
    spyOn(AnalysesQuotaEnough.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [{ 'cdb_enough_quota': true }]
      });
    });
    
    AnalysesQuotaEnough.fetch()
      .then(function (data) {
        expect(data).toEqual(true);
        done();
      });
  });

  it('error', function (done) {
    spyOn(AnalysesQuotaEnough.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.error({
        responseText: '{"error": ["foo"]}'
      });
    });

    AnalysesQuotaEnough.fetch()
      .catch(function (error) {
        expect(error).toEqual('foo');
        done();
      });
  });
});
