var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('cartodb/data/analysis-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {}
    });

    this.collection = new AnalysisDefinitionsCollection(null, {
      vizId: 'v-123',
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      configModel: configModel
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

    describe('.saveAnalysis', function () {
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

        this.beforeSaveSpy = jasmine.createSpy('beforeSave');
      });

      describe('when given a persisted node', function () {
        it('should save all analysis containing node', function () {
          spyOn(this.A, 'save');
          spyOn(this.B, 'save');

          this.collection.saveAnalysis(this.a0);
          expect(this.A.save).toHaveBeenCalled();
          expect(this.B.save).toHaveBeenCalled();

          this.A.save.calls.reset();
          this.B.save.calls.reset();
          this.collection.saveAnalysis(this.b1);
          expect(this.A.save).not.toHaveBeenCalled();
          expect(this.B.save).toHaveBeenCalled();
        });

        it('should call beforeSave if given a callback', function () {
          this.collection.saveAnalysis(this.c1, {beforeSave: this.beforeSaveSpy});
          expect(this.beforeSaveSpy).toHaveBeenCalled();
        });
      });

      describe('when given a non-persisted node', function () {
        beforeEach(function () {
          this.layerDefModel = new Backbone.Model();
          spyOn(this.layerDefModel, 'save');
        });

        it('should create a new node for a non-persisted node', function () {
          this.collection.saveAnalysis(this.x1);
          expect(this.collection.pluck('node_id').sort()).toEqual(['a1', 'b1', 'c1', 'x1'], 'should contain x1 in addition to the others');
        });

        it('should save layer after creating node if given a layer', function () {
          this.collection.saveAnalysis(this.x1, {layerDefinitionModel: this.layerDefModel});
          expect(this.collection.pluck('node_id').sort()).toEqual(['a1', 'b1', 'c1', 'x1'], 'should contain x1 in addition to the others');
          expect(this.layerDefModel.save).toHaveBeenCalled();
        });

        it('should not call beforeSave when creating a new analysis', function () {
          this.collection.saveAnalysis(this.x1, {
            beforeSave: this.beforeSaveSpy,
            layerDefinitionModel: this.layerDefModel
          });
          expect(this.beforeSaveSpy).not.toHaveBeenCalled();
        });
      });
    });

    describe('.createAnalysisForNode', function () {
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
        this.model = this.collection.createAnalysisForNode(this.nodeDefModel);
      });

      it('should return a promise', function () {
        expect(this.model).toBeDefined();
      });

      it('should use the serialized', function () {
        expect(this.collection.last().toJSON()).toEqual({
          id: undefined,
          analysis_definition: this.JSON
        });
      });
    });
  });
});
