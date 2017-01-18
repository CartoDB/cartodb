var Backbone = require('backbone');
var AnalysesServicesQuota = require('../../../../javascripts/cartodb3/data/analyses-services-quota');
var cdb = require('cartodb.js');

describe('data/analyses-services-quota', function () {
  var configModel;
  var sqlExecuteOriginal = cdb.SQL.prototype.execute;

  beforeEach(function () {
    configModel = new Backbone.Model({
      user_name: 'cdb',
      sql_api_template: 'wadus',
      api_key: 'wadus'
    });

    AnalysesServicesQuota.initialize({
      configModel: configModel
    });

    cdb.SQL.prototype.execute = function (query, vars, params) {
      params.success({
        rows: [{
          service: 'isolines',
          monthly_quota: 0,
          used_quota: 0,
          soft_limit: false,
          provider: 'heremaps'
        }, {
          service: 'hires_geocoder',
          monthly_quota: 0,
          used_quota: 0,
          soft_limit: true,
          provider: 'mapzen'
        }]
      });
    };

    AnalysesServicesQuota.getAllQuotas();
  });

  afterEach(function () {
    cdb.SQL.prototype.execute = sqlExecuteOriginal;
  });

  it('.getAllQuotas', function () {
    expect(AnalysesServicesQuota.serviceQuotasCollection.length).toBe(2);
  });

  it('.getServiceQuota', function () {
    expect(AnalysesServicesQuota.serviceQuotasCollection.at(0).get('service')).toBe('isolines');
    expect(AnalysesServicesQuota.serviceQuotasCollection.at(1).get('service')).toBe('hires_geocoder');
  });

  describe('isEnoughQuota', function () {
    it('it is enough quota', function () {
      var isEnoughQuota;
      cdb.SQL.prototype.execute = function (query, vars, params) {
        params.success({
          rows: [{
            cdb_enough_quota: true
          }]
        });
      };

      AnalysesServicesQuota.isEnoughQuota('isolines', function (value) {
        isEnoughQuota = value;
      });
      expect(isEnoughQuota).toBe(true);
    });

    it('it is NOT enough quota', function () {
      var isEnoughQuota;
      cdb.SQL.prototype.execute = function (query, vars, params) {
        params.success({
          rows: [{
            cdb_enough_quota: false
          }]
        });
      };

      AnalysesServicesQuota.isEnoughQuota('isolines', function (value) {
        isEnoughQuota = value;
      });
      expect(isEnoughQuota).toBe(false);
    });
  });
});
