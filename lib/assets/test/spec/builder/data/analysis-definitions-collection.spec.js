var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AnalysisDefinitionsCollection = require('builder/data/analysis-definitions-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');

describe('builder/data/analysis-definitions-collection', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel
    });

    this.collection = new AnalysisDefinitionsCollection(null, {
      vizId: 'v-123',
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      configModel: this.configModel
    });

    this.A = this.collection.add({
      id: 'A',
      analysis_definition: {
        id: 'a1',
        type: 'buffer',
        params: {
          radius: 100,
          source: {
            id: 'a0',
            type: 'source',
            params: {
              query: 'SELECT * FROM somewhere'
            }
          }
        }
      }
    });
    this.B = this.collection.add({
      id: 'B',
      analysis_definition: {
        id: 'b1',
        type: 'buffer',
        params: {
          radius: 100,
          source: {
            id: 'a1'
          }
        }
      }
    });
    this.C = this.collection.add({
      id: 'C',
      analysis_definition: {
        id: 'c1',
        type: 'buffer',
        params: {
          source: {
            id: 'b1'
          }
        }
      }
    });

    this.originalAjax = Backbone.ajax;
    Backbone.ajax = function () {
      return {
        always: function (cb) {
          cb();
        }
      };
    };
  });

  afterEach(function () {
    Backbone.ajax = this.originalAjax;
  });

  describe('.url', function () {
    it('should return URL', function () {
      expect(this.collection.url()).toMatch(/\/analyses$/);
    });
  });

  describe('.findAnalysisThatContainsNode', function () {
    describe('when given a node that does not have any analysis', function () {
      it('should return undefined', function () {
        expect(this.collection.findAnalysisThatContainsNode({id: 'x123'})).toBeUndefined();
      });
    });

    describe('when given a node is root', function () {
      it('should return the analysis', function () {
        expect(this.collection.findAnalysisThatContainsNode({id: 'c1'})).toBeDefined();
      });
    });

    describe('when given a node is contained in an analysis', function () {
      it('should return the analysis', function () {
        expect(this.collection.findAnalysisThatContainsNode({id: 'a0'})).toBeDefined();
      });
    });
  });

  describe('.saveAnalysisForLayer', function () {
    beforeEach(function () {
      this.a0 = this.analysisDefinitionNodesCollection.get('a0');
      this.a1 = this.analysisDefinitionNodesCollection.get('a1');
      this.b1 = this.analysisDefinitionNodesCollection.get('b1');
      this.c1 = this.analysisDefinitionNodesCollection.get('c1');

      this.x1 = this.analysisDefinitionNodesCollection.add({
        id: 'x1',
        type: 'buffer',
        params: {
          radius: 100,
          source: {
            id: 'a1'
          }
        }
      });

      this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
        configModel: this.configModel,
        userModel: this.userModel,
        analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
        mapId: '123',
        stateDefinitionModel: {}
      });
      this.layerA = this.layerDefinitionsCollection.add({
        id: 'layerA',
        kind: 'carto',
        options: {
          letter: 'a',
          source: 'a1'
        }
      });
      this.layerB = this.layerDefinitionsCollection.add({
        id: 'layerB',
        kind: 'carto',
        options: {
          letter: 'b',
          source: 'b1'
        }
      });
      this.layerC = this.layerDefinitionsCollection.add({
        id: 'layerC',
        kind: 'carto',
        options: {
          letter: 'c',
          source: 'c1'
        }
      });
      this.layerX = this.layerDefinitionsCollection.add({
        id: 'layerX',
        kind: 'carto',
        options: {
          letter: 'x',
          source: 'x1'
        }
      });
      this.beforeSaveSpy = jasmine.createSpy('beforeSave');
      spyOn(this.A, 'save');
      spyOn(this.B, 'save');
      spyOn(this.C, 'save');
      spyOn(this.layerA, 'save');
      spyOn(this.layerB, 'save');
      spyOn(this.layerC, 'save');
    });

    describe('when given a layer with an already persisted analysis', function () {
      it('should save all analysis containing node', function () {
        this.collection.saveAnalysisForLayer(this.layerA);
        expect(this.A.save).toHaveBeenCalled();
        expect(this.B.save).toHaveBeenCalled();
        expect(this.C.save).toHaveBeenCalled();

        this.A.save.calls.reset();
        this.B.save.calls.reset();
        this.collection.saveAnalysisForLayer(this.layerB);
        expect(this.A.save).not.toHaveBeenCalled();
        expect(this.B.save).toHaveBeenCalled();
        expect(this.C.save).toHaveBeenCalled();
      });
    });

    describe('when given a layer has a source that is owned by another layer', function () {
      describe('when has a persisted analysis', function () {
        beforeEach(function () {
          this.layerB.set('source', 'a0');
          this.collection.saveAnalysisForLayer(this.layerB);
        });

        it('should destroy analysis that existed for layer', function () {
          expect(this.collection.pluck('node_id')).toEqual(['a1', 'c1']);
        });
      });

      describe('when has no persisted analysis', function () {
        beforeEach(function () {
          this.layerX.set('source', 'a0');
          this.collection.saveAnalysisForLayer(this.layerX);
        });

        it('should not create any analysis since its already persisted for its owning layer', function () {
          expect(this.collection.pluck('node_id')).toEqual(['a1', 'b1', 'c1']);
        });
      });
    });

    describe('when a node is added on a node', function () {
      beforeEach(function () {
        this.analysisDefinitionNodesCollection.add({
          id: 'b2',
          type: 'buffer',
          params: {
            source: {
              id: 'b1'
            }
          }
        });
        this.layerB.set('source', 'b2');
        this.collection.saveAnalysisForLayer(this.layerB);
      });

      it('should update affected analysis', function () {
        expect(this.A.save).not.toHaveBeenCalled();
        expect(this.B.save).toHaveBeenCalled();
        expect(this.C.save).not.toHaveBeenCalled();
      });

      it('should updated analysis', function () {
        expect(this.collection.pluck('node_id').sort()).toEqual(['a1', 'b2', 'c1'], 'should contain x1 in addition to the others');
      });
    });

    describe('when given a layer with a node that is not yet saved', function () {
      beforeEach(function () {
        this.collection.saveAnalysisForLayer(this.layerX);
      });

      it('should save layer after creating node if given a layer', function () {
        expect(this.collection.pluck('node_id').sort()).toEqual(['a1', 'b1', 'c1', 'x1'], 'should contain x1 in addition to the others');
      });
    });
  });

  describe('.newAnalysisForNode', function () {
    beforeEach(function () {
      this.nodeDefModel = new Backbone.Model();
      this.JSON = {
        id: 'x0',
        type: 'source',
        params: {
          query: 'SELECT * FROM a_table'
        }
      };
      spyOn(this.nodeDefModel, 'toJSON').and.returnValue(this.JSON);
      this.model = this.collection.newAnalysisForNode(this.nodeDefModel);
    });

    it('should return a new model', function () {
      expect(this.model).toBeDefined();
    });

    it('should point to the given node id', function () {
      expect(this.model.get('node_id')).toEqual('x0');
    });
  });
});
