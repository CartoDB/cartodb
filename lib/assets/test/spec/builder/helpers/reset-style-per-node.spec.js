var QueryGeometryModel = require('builder/data/query-geometry-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var LayerDefModel = require('builder/data/layer-definition-model');
var resetStylePerNode = require('builder/helpers/reset-style-per-node');

describe('helpers/reset-style-per-node', function () {
  var layerDefModel;
  var nodeDefModel;

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*')).andReturn({ status: 200 });

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

  afterEach(function () {
    jasmine.Ajax.uninstall();
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

  it('should listen to queryGeometryModel changes', function () {
    expect(QueryGeometryModel.prototype.bind).toHaveBeenCalled();
    expect(QueryGeometryModel.prototype.bind.calls.count()).toEqual(1);
    expect(QueryGeometryModel.prototype.bind.calls.argsFor(0)[0]).toEqual('change:ready');
    expect(QueryGeometryModel.prototype.bind.calls.argsFor(0)[1]).toEqual(jasmine.any(Function));
  });

  it('should listen to querySchemaModel changes', function () {
    expect(QuerySchemaModel.prototype.bind).toHaveBeenCalled();
    expect(QuerySchemaModel.prototype.bind.calls.count()).toEqual(1);
    expect(QuerySchemaModel.prototype.bind.calls.argsFor(0)[0]).toEqual('change:ready');
    expect(QuerySchemaModel.prototype.bind.calls.argsFor(0)[1]).toEqual(jasmine.any(Function));
  });

  describe('when queryGeometryModel and querySchemaModel are ready', function () {
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

    describe('when queryGeometryModel and querySchemaModel are not fetched', function () {
      it('should not unbind the status change', function () {
        nodeDefModel.queryGeometryModel.set({
          status: 'fetching'
        });

        expect(nodeDefModel.queryGeometryModel.unbind).not.toHaveBeenCalledWith();
        expect(nodeDefModel.querySchemaModel.unbind).not.toHaveBeenCalledWith();
      });
    });

    describe('when queryGeometryModel and querySchemaModel are fetched', function () {
      beforeEach(function () {
        spyOn(nodeDefModel.querySchemaModel, 'isDone').and.returnValue(true);
        spyOn(nodeDefModel.queryGeometryModel, 'isDone').and.returnValue(true);
        spyOn(layerDefModel, 'save');
        spyOn(layerDefModel.styleModel, 'setDefaultPropertiesByType');

        nodeDefModel.queryGeometryModel.attributes.simple_geom = 'point';
      });

      it('should unbind the status change', function () {
        nodeDefModel.queryGeometryModel.set({
          simple_geom: 'point',
          status: 'fetched'
        });

        expect(nodeDefModel.queryGeometryModel.unbind).toHaveBeenCalledWith('change:status', jasmine.any(Function));
        expect(nodeDefModel.querySchemaModel.unbind).toHaveBeenCalledWith('change:status', jasmine.any(Function));
      });

      describe('and style model type is none', function () {
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
