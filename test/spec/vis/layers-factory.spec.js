var _ = require('underscore');

var VisModel = require('../../../src/vis/vis');
var AnalysisModel = require('../../../src/analysis/analysis-model');
var LayersFactory = require('../../../src/vis/layers-factory');

var createFakeAnalysis = function (attrs) {
  return new AnalysisModel(attrs, {
    vis: {},
    camshaftReference: {
      getParamNamesForAnalysisType: function () {}
    }
  });
};

describe('vis/layers-factory', function () {
  var analysis;
  var layersFactory;

  beforeEach(function () {
    this.vis = new VisModel();

    this.windshaftSettings = {
      urlTemplate: 'http://{user}.carto.com',
      userName: 'JUAN',
      templateName: 'TPL_12345678',
      statTag: 'STAT_TAG',
      apiKey: 'API_KEY',
      authToken: 'AUTH_TOKEN'
    };

    layersFactory = new LayersFactory({
      visModel: this.vis,
      windshaftSettings: this.windshaftSettings
    });

    analysis = createFakeAnalysis();
  });

  describe('attribute validation', function () {
    var testCases = [
      {
        layerType: 'CartoDB',
        // TODO: Once https://github.com/CartoDB/cartodb/issues/12885 is merged
        // source should be required again so we need to add the attribute to this test
        // expectedErrorMessage: 'The following attributes are missing: source,cartocss'
        expectedErrorMessage: 'The following attributes are missing: cartocss'
      },
      {
        layerType: 'torque',
        // TODO: Once https://github.com/CartoDB/cartodb/issues/12885 is merged
        // source should be required again so we need to add the attribute to this test
        // expectedErrorMessage: 'The following attributes are missing: source,cartocss'
        expectedErrorMessage: 'The following attributes are missing: cartocss'
      },
      {
        layerType: 'Tiled',
        expectedErrorMessage: 'The following attributes are missing: urlTemplate'
      },
      {
        layerType: 'WMS',
        expectedErrorMessage: 'The following attributes are missing: urlTemplate'
      },
      {
        layerType: 'GMapsBase',
        expectedErrorMessage: 'The following attributes are missing: baseType'
      },
      {
        layerType: 'Plain',
        expectedErrorMessage: 'The following attributes are missing: image|color'
      }
    ];

    _.each(testCases, function (testCase) {
      describe(testCase.layerType, function () {
        it('should throw an error if no properties are given', function () {
          expect(function () {
            layersFactory.createLayer(testCase.layerType, {});
          }).toThrowError(testCase.expectedErrorMessage);
        });
      });
    });
  });

  describe('tiled', function () {
    it('should create the layer model', function () {
      var layerModel = layersFactory.createLayer('tiled', {
        urlTemplate: 'http'
      });

      expect(layerModel).toBeDefined();
      expect(layerModel.get('type')).toEqual('Tiled');
    });

    _.each({
      'https://dnv9my2eseobd.cloudfront.net/': 'http://a.tiles.mapbox.com/',
      'https://maps.nlp.nokia.com/': 'http://maps.nlp.nokia.com/',
      'https://tile.stamen.com/': 'http://tile.stamen.com/',
      'https://{s}.maps.nlp.nokia.com/': 'http://{s}.maps.nlp.nokia.com/',
      'https://cartocdn_{s}.global.ssl.fastly.net/': 'http://{s}.api.cartocdn.com/',
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/': 'http://{s}.basemaps.cartocdn.com/'
    }, function (httpUrlTemplate, httpsUrlTemplate) {
      describe('when https option is undefined', function () {
        it("should not convert '" + httpUrlTemplate + "'", function () {
          var layerModel = layersFactory.createLayer('tiled', {
            urlTemplate: httpUrlTemplate
          });

          expect(layerModel.get('urlTemplate')).toEqual(httpUrlTemplate);
        });

        it("should not convert '" + httpsUrlTemplate + "'", function () {
          var layerModel = layersFactory.createLayer('tiled', {
            urlTemplate: httpsUrlTemplate
          });

          expect(layerModel.get('urlTemplate')).toEqual(httpsUrlTemplate);
        });
      });

      describe('when https option is set to true', function () {
        beforeEach(function () {
          this.vis.set('https', true);
        });

        it("should not convert '" + httpsUrlTemplate + "'", function () {
          var layerModel = layersFactory.createLayer('tiled', {
            urlTemplate: httpsUrlTemplate
          });

          expect(layerModel.get('urlTemplate')).toEqual(httpsUrlTemplate);
        });

        it("should convert '" + httpUrlTemplate + "' to '" + httpsUrlTemplate + "'", function () {
          var layerModel = layersFactory.createLayer('tiled', {
            urlTemplate: httpUrlTemplate
          });

          expect(layerModel.get('urlTemplate')).toEqual(httpsUrlTemplate);
        });
      });

      describe('when https option is set to false', function () {
        beforeEach(function () {
          this.vis.set('https', false);
        });

        it("should not convert '" + httpUrlTemplate + "'", function () {
          var layerModel = layersFactory.createLayer('tiled', {
            urlTemplate: httpUrlTemplate
          });

          expect(layerModel.get('urlTemplate')).toEqual(httpUrlTemplate);
        });

        it("should convert '" + httpsUrlTemplate + "' to '" + httpUrlTemplate + "'", function () {
          var layerModel = layersFactory.createLayer('tiled', {
            urlTemplate: httpsUrlTemplate
          });

          expect(layerModel.get('urlTemplate')).toEqual(httpUrlTemplate);
        });
      });
    });
  });

  describe('torque', function () {
    it('should create the layer model', function () {
      var layerModel = layersFactory.createLayer('torque', {
        source: analysis,
        cartocss: '#layer {}'
      });

      expect(layerModel).toBeDefined();
      expect(layerModel.get('type')).toEqual('torque');
    });

    it('should setup attrs for windshaft provider', function () {
      var layerModel = layersFactory.createLayer('torque', {
        source: analysis,
        cartocss: '#layer {}'
      });
      expect(layerModel.get('user_name')).toEqual('JUAN');
      expect(layerModel.get('maps_api_template')).toEqual('http://{user}.carto.com');
      expect(layerModel.get('stat_tag')).toEqual('STAT_TAG');
      expect(layerModel.get('named_map')).toEqual({
        name: 'TPL_12345678'
      });
      expect(layerModel.get('api_key')).toEqual('API_KEY');
      expect(layerModel.get('auth_token')).toEqual('AUTH_TOKEN');
    });

    it("should not include a named_map attr if settings don't have one", function () {
      delete this.windshaftSettings.templateName;

      var layerModel = layersFactory.createLayer('torque', {
        source: analysis,
        cartocss: '#layer {}'
      });
      expect(layerModel.get('named_map')).toBeUndefined();
    });
  });

  ['cartodb', 'torque'].forEach(function (layerType) {
    describe(layerType + ' (shared)', function () {
      it('should set accept an AnalysisMode as a source', function () {
        var layerModel = layersFactory.createLayer(layerType, {
          source: analysis,
          cartocss: '#layer {}'
        });

        expect(layerModel.getSource()).toEqual(analysis);
      });
    });
  });
});
