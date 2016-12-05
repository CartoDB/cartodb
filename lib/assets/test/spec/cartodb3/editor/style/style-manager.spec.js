var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var createDefaultVis = require('../../create-default-vis');
var StyleManager = require('../../../../../javascripts/cartodb3/editor/style/style-manager');

describe('editor/style/style-manager', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.vis = createDefaultVis();

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: this.configModel,
      vis: this.vis
    });

    var models = [{
      id: 'l-100',
      order: 1,
      kind: 'carto',
      options: {
        table_name: 'foobar',
        cartocss: 'before'
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

  describe('track changes', function () {
    it('should track style changes', function () {
      // remove binding to onChange so the style changes are not sent to cartodb.js layers (which are not created in the test suite)
      this.collection.off('change', this.collection._onChange, this.collection);
      this.layerDefModel.styleModel.set({ fill: { color: { fixed: '#000', opacity: 0.4 } } });
      expect(this.layerDefModel.get('cartocss').indexOf('marker-fill: #000;')).not.toBe(-1);
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

    it('should change alphamarker url when installation is custom', function () {
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
      expect(this.layerDefModel.get('type')).toBe('torque');
      expect(this.layerDefModel.get('cartocss').indexOf('marker-file: url(//s3.amazonaws.com/')).not.toBe(-1);

      this.configModel.set('cartodb_com_hosted', true);
      this.layerDefModel.styleModel.set('style', 'dummy');
      expect(this.layerDefModel.get('cartocss').indexOf('marker-file: url(//s3.amazonaws.com/)')).toBe(-1);
      expect(this.layerDefModel.get('cartocss').indexOf('marker-file: url(/public/assets/)')).toBe(-1);
    });

    it('should track style changes on add', function () {
      this.collection.add({
        id: 'l-101',
        order: 2,
        kind: 'carto',
        options: {
          table_name: 'hey',
          cartocss: 'after'
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
  });
});
