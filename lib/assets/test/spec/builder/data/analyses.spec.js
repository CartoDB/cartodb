var Backbone = require('backbone');
var _ = require('underscore');
var analyses = require('builder/data/analyses');
var ConfigModel = require('builder/data/config-model');
var DataServicesApiCheck = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-info');
var camshaftReference = require('camshaft-reference').getVersion('latest');
var UnknownTypeFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/unknown-type-form-model');
var FallbackFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model');
var DeprecatedSQLFunctionOptionModel = require('builder/components/modals/add-analysis/analysis-option-models/deprecated-sql-function-option-model');

describe('builder/data/analyses', function () {
  Object.keys(analyses.MAP).forEach(function (key) {
    var def = analyses.MAP[key];

    describe(key + ' item', function () {
      it('should have a title', function () {
        expect(def.title).toEqual(jasmine.any(String));
      });

      it('should have a FormModel', function () {
        expect(def.FormModel).toEqual(jasmine.any(Function));
      });
    });
  }, this);

  describe('deprecated-sql-function analysis', function () {
    it('should have ModalModel', function () {
      var sqlAnalysis = analyses.MAP['deprecated-sql-function'];

      var optionModel = new sqlAnalysis.ModalModel(null, {
        nodeAttrs: {
          key: 'value'
        }
      });

      expect(optionModel instanceof DeprecatedSQLFunctionOptionModel).toBe(true);
    });
  });

  describe('getAnalysesByModalCategory', function () {
    beforeEach(function () {
      this.configModel = new ConfigModel({
        user_name: 'foo',
        sql_api_template: 'foo',
        api_key: 'foo',
        dataservices_enabled: {
          geocoder_internal: true,
          hires_geocoder: true,
          isolines: true,
          routing: true,
          data_observatory: true
        }
      });

      this.userModel = new Backbone.Model();

      this.queryGeometryModel = new Backbone.Model();
      this.queryGeometryModel.isPolygon = function () { return true; };
    });

    describe('data observatory', function () {
      beforeEach(function () {
        dataservicesApiHealth = DataServicesApiCheck.get(this.configModel);
        spyOn(dataservicesApiHealth, 'getService');
      });

      afterEach(function () {
        DataServicesApiCheck.get(this.configModel)._ready = 'ready';
      });

      var findDataObservatory = function (models, type) {
        return _.filter(models, function (model) {
          return model.nodeAttrs.type === type;
        });
      };

      var dataservicesApiHealth;

      describe('dataservices api existing', function () {
        it('should be enabled if the user has credits and hard limit', function () {
          var DO = new Backbone.Model({
            service: 'observatory',
            monthly_quota: 100,
            soft_limit: true
          });

          dataservicesApiHealth._ready = 'ready';
          dataservicesApiHealth.getService.and.returnValue(DO);
          var analysisModels = analyses.getAnalysesByModalCategory('create_clean', {
            userModel: this.userModel,
            configModel: this.configModel,
            queryGeometryModel: this.queryGeometryModel
          });
          expect(analysisModels.length).toBe(4);
          expect(findDataObservatory(analysisModels, 'data-observatory-measure').length).toBe(0);
        });

        it('should NOT be enabled if the user has hard limit', function () {
          var DO = new Backbone.Model({
            service: 'observatory',
            monthly_quota: 100,
            soft_limit: false
          });

          dataservicesApiHealth._ready = 'ready';
          dataservicesApiHealth.getService.and.returnValue(DO);
          var analysisModels = analyses.getAnalysesByModalCategory('create_clean', {
            userModel: this.userModel,
            configModel: this.configModel,
            queryGeometryModel: this.queryGeometryModel
          });
          expect(analysisModels.length).toBe(4);
          expect(findDataObservatory(analysisModels, 'data-observatory-measure').length).toBe(0);
        });

        it('should NOT be enabled if the user doesn\'t have credits', function () {
          var DO = new Backbone.Model({
            service: 'observatory',
            monthly_quota: 0,
            soft_limit: true
          });

          dataservicesApiHealth._ready = 'ready';
          dataservicesApiHealth.getService.and.returnValue(DO);
          var analysisModels = analyses.getAnalysesByModalCategory('create_clean', {
            userModel: this.userModel,
            configModel: this.configModel,
            queryGeometryModel: this.queryGeometryModel
          });
          expect(analysisModels.length).toBe(4);
          expect(findDataObservatory(analysisModels, 'data-observatory-measure').length).toBe(0);
        });
      });

      it('dataservices api not existing', function () {
        DataServicesApiCheck.get(this.configModel)._ready = 'notready';
        var analysisModels = analyses.getAnalysesByModalCategory('create_clean', {
          userModel: this.userModel,
          configModel: this.configModel,
          queryGeometryModel: this.queryGeometryModel
        });
        expect(analysisModels.length).toBe(3);
        expect(findDataObservatory(analysisModels, 'data-observatory-measure').length).toBe(0);
      });
    });
  });

  describe('.findFormModelByType', function () {
    describe('when given an unknown type', function () {
      it('should return an unknown model', function () {
        expect(analyses.findFormModelByType('unknown-indeed')).toBe(UnknownTypeFormModel);
        expect(analyses.findFormModelByType()).toBe(UnknownTypeFormModel);
        expect(analyses.findFormModelByType({})).toBe(UnknownTypeFormModel);
        expect(analyses.findFormModelByType(true)).toBe(UnknownTypeFormModel);
        expect(analyses.findFormModelByType(false)).toBe(UnknownTypeFormModel);
      });
    });

    describe('when given a type which is not implemented (yet)', function () {
      beforeEach(function () {
        camshaftReference.analyses['just-for-testing'] = {};
      });

      afterEach(function () {
        delete camshaftReference['just-for-testing'];
      });

      it('should return fallback model', function () {
        expect(analyses.findFormModelByType('just-for-testing')).toBe(FallbackFormModel);
      });
    });

    describe('when given a dummy type (not in camshaft)', function () {
      it('should not return an Unknown model', function () {
        expect(analyses.findFormModelByType('georeference-placeholder')).not.toBe(UnknownTypeFormModel);
      });
    });

    describe('when given an implemented type', function () {
      it('should return its formModel', function () {
        var BufferFormModel = analyses.findFormModelByType('buffer');
        expect(BufferFormModel).toBeDefined();
        expect(BufferFormModel).not.toBe(UnknownTypeFormModel);
        expect(BufferFormModel).not.toBe(FallbackFormModel);
      });
    });
  });

  describe('.title', function () {
    describe('when given an unknown type', function () {
      it('should return unknown title', function () {
        expect(analyses.title()).toEqual('analyses.unknown');
        expect(analyses.title('')).toEqual('analyses.unknown');
        expect(analyses.title({})).toEqual('analyses.unknown');
        expect(analyses.title(true)).toEqual('analyses.unknown');
      });
    });

    describe('when given a type which is not implemented (yet)', function () {
      beforeEach(function () {
        camshaftReference.analyses['just-for-testing'] = {};
      });

      afterEach(function () {
        delete camshaftReference['just-for-testing'];
      });

      it('should return the default for type', function () {
        expect(analyses.title('just-for-testing')).toEqual('analyses.just-for-testing');
      });
    });

    describe('when given an implemented type', function () {
      it('should return a corresponding title', function () {
        expect(analyses.title('buffer')).toEqual(jasmine.any(String));
        expect(analyses.title('buffer')).not.toContain('unknown');
      });
    });

    describe('when given a DO analysis', function () {
      it('should return the measurement as the title for the DO analysis if implemented', function () {
        var model = new Backbone.Model({
          type: 'data-observatory-measure',
          measurement: 'age-and-gender'
        });
        expect(analyses.title(model)).toEqual('analyses.data-observatory-measure.age-and-gender');
      });

      it('should return the default title if the measurement is not implemented', function () {
        var model = new Backbone.Model({
          type: 'data-observatory-measure',
          measurement: 'something-very-new'
        });
        expect(analyses.title(model)).toEqual('analyses.data-observatory-measure.title');
      });
    });

    describe('when given a model', function () {
      it('should return the corresponding title', function () {
        var model = new Backbone.Model({type: 'buffer'});
        expect(analyses.title(model)).toEqual(jasmine.any(String));
        expect(analyses.title(model)).not.toContain('unknown');
        expect(analyses.title(model)).toEqual(analyses.title('buffer'));
      });
    });
  });

  describe('.link', function () {
    describe('when given an unknown type', function () {
      it('should return empty link', function () {
        expect(analyses.link()).toBe('');
        expect(analyses.link('')).toBe('');
        expect(analyses.link({})).toBe('');
        expect(analyses.link(true)).toBe('');
      });
    });

    describe('when given a model', function () {
      it('should return the corresponding link', function () {
        var model = new Backbone.Model({type: 'buffer'});
        expect(analyses.link(model)).toEqual(jasmine.any(String));
        expect(analyses.link(model)).not.toContain('unknown');
        expect(analyses.link(model)).toEqual(analyses.link('buffer'));
      });
    });
  });

  describe('MAP', function () {
    it('should have right properties for closest analysis', function () {
      expect(analyses.MAP.closest).toBeDefined();
      expect(analyses.MAP.closest.modalTitle).toEqual('editor.layers.analysis-form.find-nearest.modal-title');
      expect(analyses.MAP.closest.modalDesc).toEqual('editor.layers.analysis-form.find-nearest.modal-desc');
      expect(analyses.MAP.closest.modalCategory).toEqual('analyze_predict');
      expect(analyses.MAP.closest.modalLink).toEqual('https://carto.com/learn/guides/analysis/find-nearest');
      expect(analyses.MAP.closest.onboardingTemplate).toEqual(jasmine.any(Function));
    });

    it('should have dummy property on certain analyses', function () {
      expect(analyses.MAP['georeference-placeholder'].dummy).toBeDefined();
      expect(analyses.MAP['georeference-placeholder'].dummy).toBe(true);
    });
  });

  describe('checkIfxxx several checks', function () {
    var checkIfxxxTest = function (testTypes, dataServicesFlag) {
      var readyCalled = false;
      var fakeDS = {
        isReady: function () {
          readyCalled = true;
          return true;
        }
      };
      spyOn(DataServicesApiCheck, 'get').and.returnValue(fakeDS);

      var userModel = new Backbone.Model();
      var queryGeometryModel = new Backbone.Model();
      queryGeometryModel.isPolygon = function () { return true; };

      _.each(testTypes, function (analysisType) {
        var checkIfEnabled = analyses.MAP[analysisType].checkIfEnabled;
        var configModel = {
          dataServiceEnabled: function () {}
        };
        spyOn(configModel, 'dataServiceEnabled').and.returnValue(true);
        readyCalled = false;

        expect(checkIfEnabled).toBeDefined();

        var result = checkIfEnabled({
          userModel: userModel,
          queryGeometryModel: queryGeometryModel,
          configModel: configModel
        });

        expect(result).toBe(true);
        expect(readyCalled).toBe(true);
        expect(configModel.dataServiceEnabled).toHaveBeenCalledWith(dataServicesFlag);
      });
    };

    it('analyses that needs georeference should check dataservices', function () {
      var geoReferenceAnalyses = [
        'georeference-city',
        'georeference-ip-address',
        'georeference-country',
        'georeference-postal-code',
        'georeference-admin-region'
      ];
      checkIfxxxTest(geoReferenceAnalyses, 'geocoder_internal');
    });

    it('analyses that needs routing should check dataservices', function () {
      var routingAnalyses = [
        'routing-sequential',
        'routing-to-layer-all-to-all',
        'routing-to-single-point'
      ];
      checkIfxxxTest(routingAnalyses, 'routing');
    });

    it('analyses that needs external geocoding should check dataservices', function () {
      var externalGeocodingAnalyses = [
        'georeference-street-address'
      ];
      checkIfxxxTest(externalGeocodingAnalyses, 'hires_geocoder');
    });

    it('analyses that needs Data Observatory should check dataservices', function () {
      var dataObservatoryAnalyses = [
        'data-observatory-measure'
      ];
      checkIfxxxTest(dataObservatoryAnalyses, 'data_observatory');
    });
  });

  describe('isAnalysisValidByType', function () {
    it('should call `checkIfEnabled` if the analysis has a `checkIf` function', function () {
      var theAnalysis = analyses.MAP['georeference-city'];
      spyOn(theAnalysis, 'checkIfEnabled').and.returnValue(true);

      analyses.isAnalysisValidByType('georeference-city');

      expect(theAnalysis.checkIfEnabled).toHaveBeenCalled();
    });
  });
});
