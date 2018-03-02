var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var createDefaultVis = require('../../create-default-vis');
var StyleManager = require('builder/editor/style/style-manager');

describe('editor/style/style-manager', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?://.*map.*'))
      .andReturn({ status: 200 });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe',
      app_assets_base_url: '/public/assets'
    });

    var userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.vis = createDefaultVis();

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: this.configModel,
      userModel: userModel,
      vis: this.vis
    });

    var models = [{
      id: 'l-100',
      order: 1,
      kind: 'carto',
      options: {
        table_name: 'foobar',
        cartocss: 'before',
        source: 'a0'
      }
    }];

    this.collection = new LayerDefinitionsCollection(models, {
      configModel: this.configModel,
      userModel: userModel,
      visMap: this.vis.map,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });

    this.layerDefModel = this.collection.at(0);
    this.styleManager = new StyleManager(this.collection, this.vis.map, this.configModel);
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe('track changes', function () {
    it('should track style changes', function () {
      // remove binding to onChange so the style changes are not sent to cartodb.js layers (which are not created in the test suite)
      this.collection.off('change', this.collection._onChange, this.collection);
      this.layerDefModel.styleModel.set({ fill: { color: { fixed: '#000', opacity: 0.4 } } });
      expect(this.layerDefModel.get('cartocss').indexOf('marker-fill: #000;')).not.toBe(-1);
    });

    it('should update the layer definition model based on previous custom css', function () {
      // remove binding to onChange so the style changes are not sent to cartodb.js layers (which are not created in the test suite)
      this.collection.off('change', this.collection._onChange, this.collection);

      var css = '#layer { marker-width: 21.5; marker-fill: #d300ff; marker-fill-opacity: 1; marker-allow-overlap: true; marker-line-width: 1; marker-line-color: #ff0e0e; marker-line-opacity: 1; }';

      this.layerDefModel.set({
        previousCartoCSSCustom: true,
        previousCartoCSS: css,
        cartocss_custom: false
      });

      this.layerDefModel.styleModel.set({
        type: 'hexabins',
        dummy: 1,
        aggregation: {
          size: 100,
          value: {
            operator: 'count',
            attribute: 'test'
          }
        }
      });
      expect(this.layerDefModel.get('cartocss')).toBe(css);
      expect(this.layerDefModel.get('sql_wrap').indexOf('WITH hgrid')).not.toBe(-1);
    });

    it('should update sql when style changes', function () {
      // remove binding to onChange so the style changes are not sent to cartodb.js layers (which are not created in the test suite)
      this.collection.off('change', this.collection._onChange, this.collection);
      this.layerDefModel.styleModel.set({
        type: 'hexabins',
        dummy: 1,
        aggregation: {
          size: 100,
          value: {
            operator: 'count',
            attribute: 'test'
          }
        }
      });
      expect(this.layerDefModel.get('cartocss').indexOf('polygon-fill: #')).not.toBe(-1);
      expect(this.layerDefModel.get('sql_wrap').indexOf('WITH hgrid')).not.toBe(-1);
    });

    it('should update layer type when style is animation', function () {
      // remove binding to onChange so the style changes are not sent to cartodb.js layers (which are not created in the test suite)
      this.collection.off('change', this.collection._onChange, this.collection);
      this.layerDefModel.styleModel.set({
        type: 'animation',
        dummy: 1,
        style: 'simple',
        fill: {
          'color': {
            fixed: '#000',
            opacity: 0.4
          },
          'image': null
        },
        animated: {
          attribute: 'test',
          overlap: 'linear',
          duration: 30,
          steps: 256,
          resolution: 2,
          trails: 2
        }
      });
      expect(this.layerDefModel.get('type')).toBe('torque');
    });

    it('should change alphamarker url based on asset host', function () {
      // remove binding to onChange so the style changes are not sent to cartodb.js layers (which are not created in the test suite)
      this.collection.off('change', this.collection._onChange, this.collection);
      this.layerDefModel.styleModel.set({
        type: 'heatmap',
        dummy: 1,
        fill: {
          'color': {
            range: ['#4b2991', '#872ca2', '#c0369d', '#ea4f88', '#fa7876', '#f6a97a', '#edd9a3'],
            opacity: 0.4,
            bins: 6,
            attribute: 'cartodb_id'
          },
          'image': null
        },
        animated: {
          attribute: 'cartodb_id',
          overlap: 'linear',
          duration: 30,
          steps: 256,
          resolution: 2,
          trails: 2
        }
      });
      this.configModel.set('app_assets_base_url', 'https://cartodb-libs.global.ssl.fastly.net/cartodbui/assets');
      this.layerDefModel.styleModel.set('style', 'dummy1');
      expect(this.layerDefModel.get('type')).toBe('torque');
      expect(this.layerDefModel.get('cartocss')).toContain('marker-file: url(https://cartodb-libs.global.ssl.fastly.net/cartodbui/assets/unversioned/images/alphamarker.png);');

      this.configModel.set('app_assets_base_url', 'http://user.localhost:lan:3000/assets');
      this.layerDefModel.styleModel.set('style', 'dummy2');
      expect(this.layerDefModel.get('cartocss')).not.toContain('marker-file: url(https://cartodb-libs.global.ssl.fastly.net/cartodbui/assets/unversioned/images/alphamarker.png);');
      expect(this.layerDefModel.get('cartocss')).toContain('marker-file: url(http://user.localhost:lan:3000/assets/unversioned/images/alphamarker.png);');
    });

    it('should track style changes on add', function () {
      this.collection.add({
        id: 'l-101',
        order: 2,
        kind: 'carto',
        options: {
          table_name: 'hey',
          cartocss: 'after',
          source: 'a0'
        }
      });
      var layerDefModel = this.collection.at(1);
      layerDefModel.styleModel.set({
        fill: {
          color: {
            fixed: '#000',
            opacity: 0.4
          }
        }
      });
      expect(layerDefModel.get('cartocss').indexOf('marker-fill: #000')).not.toBe(-1);
      expect(layerDefModel.get('cartocss').indexOf('marker-fill-opacity: 0.4')).not.toBe(-1);
    });

    it('should track changes on autoStyle', function () {
      spyOn(this.layerDefModel, 'set').and.callThrough();
      this.layerDefModel.set({autoStyle: true});
      this.layerDefModel.set.calls.reset();

      expect(this.layerDefModel.set).not.toHaveBeenCalled();

      this.layerDefModel.set.calls.reset();
      this.layerDefModel.set({autoStyle: false});
      expect(this.layerDefModel.set).toHaveBeenCalled();
    });
  });
});
