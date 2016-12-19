var QueryGeometryModel = require('../../../../javascripts/cartodb3/data/query-geometry-model');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodeModel = require('../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var resetStylePerNode = require('../../../../javascripts/cartodb3/helpers/reset-style-per-node');

describe('helpers/reset-style-per-node', function () {
  var layerDefModel;
  var nodeDefModel;

  beforeEach(function () {
    spyOn(QueryGeometryModel.prototype, 'bind').and.callThrough();
    spyOn(QuerySchemaModel.prototype, 'bind').and.callThrough();

    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      api_key: 'xyz123'
    });

    nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'z0',
      type: 'source',
      params: {
        query: 'SELECT * from pepito'
      }
    }, {
      configModel: configModel
    });

    layerDefModel = new LayerDefModel({
      id: 'layerA',
      kind: 'carto',
      options: {
        table_name: 'pepito',
        letter: 'z',
        source: 'z0'
      }
    }, {
      configModel: configModel,
      parse: true
    });

    layerDefModel.collection = {
      contains: function () {
        return true;
      }
    };

    nodeDefModel.queryGeometryModel.attributes.query = 'SELECT * from pepito';
    nodeDefModel.querySchemaModel.attributes.query = 'SELECT * from pepito';

    QueryGeometryModel.prototype.bind.calls.reset();
    QuerySchemaModel.prototype.bind.calls.reset();

    this._forceStyle = false;
    this._resetQuery = false;

    resetStylePerNode(nodeDefModel, layerDefModel, this._forceStyle, this._resetQuery);
  });

  describe('reset query', function () {
    it('should reset schema and geometry models if param is enabled', function () {
      var spyCallback = jasmine.createSpy('ready');
      nodeDefModel.queryGeometryModel.set('ready', true);
      nodeDefModel.querySchemaModel.set('ready', true);
      nodeDefModel.queryGeometryModel.bind('change:ready', spyCallback);
      resetStylePerNode(nodeDefModel, layerDefModel, false, true);
      expect(spyCallback).toHaveBeenCalled();
      expect(nodeDefModel.queryGeometryModel.get('ready')).toBeFalsy();
      expect(nodeDefModel.querySchemaModel.get('ready')).toBeFalsy();
    });
  });

  it('should listen to query-geometry-model changes', function () {
    expect(QueryGeometryModel.prototype.bind).toHaveBeenCalled();
    expect(QueryGeometryModel.prototype.bind.calls.count()).toEqual(1);
    expect(QueryGeometryModel.prototype.bind.calls.argsFor(0)[0]).toEqual('change:ready');
    expect(QueryGeometryModel.prototype.bind.calls.argsFor(0)[1]).toEqual(jasmine.any(Function));
  });

  it('should listen to query-schema-model changes', function () {
    expect(QuerySchemaModel.prototype.bind).toHaveBeenCalled();
    expect(QuerySchemaModel.prototype.bind.calls.count()).toEqual(1);
    expect(QuerySchemaModel.prototype.bind.calls.argsFor(0)[0]).toEqual('change:ready');
    expect(QuerySchemaModel.prototype.bind.calls.argsFor(0)[1]).toEqual(jasmine.any(Function));
  });

  describe('when query-geometry-model and query-schema-model are ready', function () {
    beforeEach(function () {
      QueryGeometryModel.prototype.bind.calls.reset();
      QuerySchemaModel.prototype.bind.calls.reset();

      spyOn(nodeDefModel.queryGeometryModel, 'unbind').and.callThrough();
      spyOn(nodeDefModel.queryGeometryModel, 'fetch');

      spyOn(nodeDefModel.querySchemaModel, 'unbind').and.callThrough();
      spyOn(nodeDefModel.querySchemaModel, 'fetch');

      nodeDefModel.queryGeometryModel.set({ ready: true });
      nodeDefModel.querySchemaModel.set({ ready: true });
    });

    it('should remove listeners', function () {
      expect(nodeDefModel.queryGeometryModel.unbind).toHaveBeenCalledWith('change:ready', jasmine.any(Function));
      expect(nodeDefModel.querySchemaModel.unbind).toHaveBeenCalledWith('change:ready', jasmine.any(Function));
    });

    it('should listen to status attr', function () {
      expect(QueryGeometryModel.prototype.bind.calls.count()).toEqual(2);
      expect(QueryGeometryModel.prototype.bind.calls.argsFor(1)[0]).toEqual('change:status');
      expect(QueryGeometryModel.prototype.bind.calls.argsFor(1)[1]).toEqual(jasmine.any(Function));

      expect(QuerySchemaModel.prototype.bind.calls.count()).toEqual(2);
      expect(QuerySchemaModel.prototype.bind.calls.argsFor(0)[0]).toEqual('change:status');
      expect(QuerySchemaModel.prototype.bind.calls.argsFor(0)[1]).toEqual(jasmine.any(Function));
    });

    describe('fetch models', function () {
      it('should fetch geometry model if it is not fetching or it is available', function () {
        expect(nodeDefModel.queryGeometryModel.fetch).toHaveBeenCalled();
      });

      it('should fetch schema model if it is not fetching or it is available', function () {
        expect(nodeDefModel.queryGeometryModel.fetch).toHaveBeenCalled();
      });
    });

    describe('when query-geometry-model is resetted (by other request, for example)', function () {
      beforeEach(function () {
        nodeDefModel.queryGeometryModel.set('status', 'unfetched');
      });

      it('should unbind the status change', function () {
        expect(nodeDefModel.queryGeometryModel.unbind).toHaveBeenCalledWith('change:status', jasmine.any(Function));
        expect(nodeDefModel.querySchemaModel.unbind).toHaveBeenCalledWith('change:status', jasmine.any(Function));
      });
    });

    describe('when query-schema-model is resetted (by other request, for example)', function () {
      beforeEach(function () {
        nodeDefModel.querySchemaModel.set('status', 'unfetched');
      });

      it('should unbind the status change', function () {
        expect(nodeDefModel.queryGeometryModel.unbind).toHaveBeenCalledWith('change:status', jasmine.any(Function));
        expect(nodeDefModel.querySchemaModel.unbind).toHaveBeenCalledWith('change:status', jasmine.any(Function));
      });
    });

    describe('when query-geometry-model and query-schema-model are fetched', function () {
      beforeEach(function () {
        nodeDefModel.queryGeometryModel.attributes.simple_geom = 'point';
        spyOn(layerDefModel, 'save');
        spyOn(layerDefModel.styleModel, 'setDefaultPropertiesByType');
      });

      describe('and style model type is none', function () {
        beforeEach(function () {
          layerDefModel.styleModel.attributes.type = 'none';
          nodeDefModel.queryGeometryModel.set({
            simple_geom: 'point',
            status: 'fetched'
          });
        });

        it('should reset styles, no matter the rest of the options', function () {
          expect(layerDefModel.styleModel.setDefaultPropertiesByType).toHaveBeenCalledWith('simple', 'point');
        });

        it('should save the layer', function () {
          expect(layerDefModel.save).toHaveBeenCalled();
        });
      });

      describe('and forceStyle option', function () {
        beforeEach(function () {
          this._forceStyle = true;
          spyOn(nodeDefModel.querySchemaModel, 'hasDifferentSchemaThan').and.returnValue(true);
          nodeDefModel.queryGeometryModel.set({
            simple_geom: '',
            status: 'fetched'
          });
        });

        it('should reset styles, no matter the rest of the options', function () {
          expect(layerDefModel.styleModel.setDefaultPropertiesByType).toHaveBeenCalled();
        });

        it('should save the layer', function () {
          expect(layerDefModel.save).toHaveBeenCalled();
        });
      });

      describe('and cartocss is custom', function () {
        beforeEach(function () {
          layerDefModel.set('cartocss_custom', true);
          nodeDefModel.queryGeometryModel.set({
            simple_geom: 'polygon',
            status: 'fetched'
          });
        });

        it('should not reset styles', function () {
          expect(layerDefModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
        });

        it('should not save the layer', function () {
          expect(layerDefModel.save).not.toHaveBeenCalled();
        });
      });

      describe('and schema has changed', function () {
        beforeEach(function () {
          layerDefModel.set('cartocss_custom', true);
          spyOn(nodeDefModel.querySchemaModel, 'hasDifferentSchemaThan').and.returnValue(true);
        });

        it('should not reset styles', function () {
          expect(layerDefModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
        });

        it('should not save the layer', function () {
          expect(layerDefModel.save).not.toHaveBeenCalled();
        });
      });

      describe('and geometry is different', function () {
        beforeEach(function () {
          nodeDefModel.queryGeometryModel.set({
            simple_geom: 'polygon',
            status: 'fetched'
          });
        });

        it('should reset styles', function () {
          expect(layerDefModel.styleModel.setDefaultPropertiesByType).toHaveBeenCalledWith('simple', 'polygon');
        });

        it('should save the layer', function () {
          expect(layerDefModel.save).toHaveBeenCalled();
        });
      });

      describe('and geometry is the same', function () {
        beforeEach(function () {
          layerDefModel.styleModel.setDefaultPropertiesByType.calls.reset();
          layerDefModel.save.calls.reset();
          nodeDefModel.queryGeometryModel.set({
            simple_geom: 'point',
            status: 'fetched'
          });
        });

        it('should not reset styles', function () {
          expect(layerDefModel.styleModel.setDefaultPropertiesByType.calls.count()).toBe(0);
        });

        it('should not save the layer', function () {
          expect(layerDefModel.save.calls.count()).toBe(0);
        });
      });

      describe('and geometry is unknown', function () {
        beforeEach(function () {
          nodeDefModel.queryGeometryModel.set({
            simple_geom: '',
            status: 'fetched'
          });
        });

        it('should reset styles with none type', function () {
          expect(layerDefModel.styleModel.setDefaultPropertiesByType).toHaveBeenCalledWith('none');
        });

        it('should save the layer', function () {
          expect(layerDefModel.save).toHaveBeenCalled();
        });
      });
    });
  });
});
