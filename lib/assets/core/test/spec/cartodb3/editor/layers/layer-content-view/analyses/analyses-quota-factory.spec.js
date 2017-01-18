var Backbone = require('backbone');
var _ = require('underscore');
var AnalysesQuotaFactory = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-quota-factory');
var QUOTA_FIELDS = ['totalQuota', 'usedQuota', 'blockSize', 'blockPrice', 'hardLimit'];
var AnalysesServicesQuota = require('../../../../../../../javascripts/cartodb3/data/analyses-services-quota');
var cdb = require('cartodb.js');

describe('editor/layers/layer-content-view/analyses/analyses-quota-factory', function () {
  var sqlExecuteOriginal = cdb.SQL.prototype.execute;

  beforeEach(function () {
    cdb.SQL.prototype.execute = function (query, vars, params) {
      params.success({
        rows: [{
          cdb_enough_quota: true
        }]
      });
    };

    var configModel = new Backbone.Model({
      user_name: 'cdb',
      sql_api_template: 'wadus',
      api_key: 'wadus'
    });

    AnalysesServicesQuota.initialize({
      configModel: configModel
    });

    AnalysesServicesQuota.serviceQuotasCollection = new Backbone.Collection([{
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
    }]);

    this.userModel = new Backbone.Model({
      isolines_provider: 'heremaps',
      geocoder_provider: 'heremaps'
    });
    this.userModel._organizationModel = new Backbone.Model({
      isolines_provider: 'heremaps',
      geocoder_provider: 'heremaps'
    });

    this.userModel.isInsideOrg = function () {
      return false;
    };
    this.userModel.getOrganization = function () {
      return this.userModel._organizationModel;
    }.bind(this);
  });

  afterEach(function () {
    cdb.SQL.prototype.execute = sqlExecuteOriginal;
  });

  describe('analyses without quota', function () {
    it('should not return any quota info', function () {
      expect(AnalysesQuotaFactory.requiresQuota('carto-analysis', this.userModel)).toBeFalsy();
    });
  });

  describe('analysis with quota', function () {
    describe('trade-area', function () {
      it('should return quota', function () {
        expect(AnalysesQuotaFactory.requiresQuota('trade-area', this.userModel)).toBeTruthy();
        var analysisQuota = AnalysesQuotaFactory.getQuotaInfo('trade-area', this.userModel);
        _.each(QUOTA_FIELDS, function (item) {
          expect(analysisQuota[item]).toBeDefined();
        });
      });

      it('should not require quota when provider is different than heremaps', function () {
        expect(AnalysesQuotaFactory.requiresQuota('trade-area', this.userModel)).toBeTruthy();
        this.userModel.set('isolines_provider', null);
        expect(AnalysesQuotaFactory.requiresQuota('trade-area', this.userModel)).toBeFalsy();
      });

      it('should take organization provider attributes when user belongs to one', function () {
        this.userModel.isInsideOrg = function () { return true; };
        expect(AnalysesQuotaFactory.requiresQuota('trade-area', this.userModel)).toBeTruthy();
        this.userModel.set('isolines_provider', null);
        expect(AnalysesQuotaFactory.requiresQuota('trade-area', this.userModel)).toBeTruthy();
      });
    });

    describe('georeference-street-address', function () {
      it('should return quota', function () {
        expect(AnalysesQuotaFactory.requiresQuota('georeference-street-address', this.userModel)).toBeTruthy();
        var analysisQuota = AnalysesQuotaFactory.getQuotaInfo('georeference-street-address', this.userModel);
        _.each(QUOTA_FIELDS, function (item) {
          expect(analysisQuota[item]).toBeDefined();
        });
      });

      it('should not require quota when provider is not set or is different than heremaps', function () {
        expect(AnalysesQuotaFactory.requiresQuota('georeference-street-address', this.userModel)).toBeTruthy();
        this.userModel.set('geocoder_provider', null);
        expect(AnalysesQuotaFactory.requiresQuota('georeference-street-address', this.userModel)).toBeFalsy();
        this.userModel.set('geocoder_provider', 'mapzen');
        expect(AnalysesQuotaFactory.requiresQuota('georeference-street-address', this.userModel)).toBeFalsy();
        this.userModel.set('geocoder_provider', 'google');
        expect(AnalysesQuotaFactory.requiresQuota('georeference-street-address', this.userModel)).toBeFalsy();
      });

      it('should take organization provider attributes when user belongs to one', function () {
        this.userModel.isInsideOrg = function () { return true; };
        expect(AnalysesQuotaFactory.requiresQuota('georeference-street-address', this.userModel)).toBeTruthy();
        this.userModel.set('geocoder_provider', null);
        expect(AnalysesQuotaFactory.requiresQuota('georeference-street-address', this.userModel)).toBeTruthy();
      });
    });
  });
});
