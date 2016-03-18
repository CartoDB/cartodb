var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var createDefaultVis = require('../create-default-vis');

describe('data/analysis-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var vis = createDefaultVis();
    this.analysis = vis.analysis;
    spyOn(this.analysis, 'analyse');

    this.collection = new AnalysisDefinitionsCollection(null, {
      vizId: 'v-123',
      analysis: this.analysis,
      configModel: configModel
    });
    spyOn(Backbone, 'sync');
  });

  describe('.url', function () {
    it('should return URL', function () {
      expect(this.collection.url()).toMatch(/\/analyses$/);
    });
  });

  describe('.createNode', function () {
    describe('when a source node has been added', function () {
      beforeEach(function () {
        this.res = this.collection.createNode({
          id: 'a0',
          type: 'source',
          query: 'SELECT * FROM meh'
        });
      });

      it('should not create any analysis', function () {
        expect(this.collection.length).toEqual(0);
      });

      it('should return the new node', function () {
        expect(this.res).toBe(this.collection.analysisDefinitionNodesCollection.get('a0'));
      });

      describe('when a non-source (e.g. trade-area) node is added on top of the source node', function () {
        beforeEach(function () {
          Backbone.sync.calls.reset();
          spyOn(this.collection, 'create').and.callThrough();

          this.collection.createNode({
            type: 'trade-area',
            kind: 'bike',
            time: 123,
            source_id: 'a0'
          });
        });

        it('should call create but not add model to collection just yet', function () {
          expect(this.collection.create).toHaveBeenCalled();
          expect(this.collection.create.calls.argsFor(0)[0]).toEqual({
            analysis_definition: jasmine.any(Object)
          });
          expect(this.collection.isEmpty()).toBe(true);
        });

        describe('when analysis creation fails', function () {
          beforeEach(function () {
            Backbone.sync.calls.argsFor(0)[2].error({
              error: 'you fool!'
            });
          });

          it('should remove the new node', function () {
            expect(this.collection.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0']);
          });
        });

        describe('when analysis creation is confirmed', function () {
          beforeEach(function () {
            Backbone.sync.calls.argsFor(0)[2].success({
              analysis_definition: this.collection.analysisDefinitionNodesCollection.get('a1').toJSON()
            });
          });

          it('should create the analysis, pointing to trade-area node', function () {
            expect(this.collection.length).toEqual(1);
            expect(this.collection.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'a1']);

            var m = this.collection.last();
            expect(m.get('node_id')).toEqual('a1');
            expect(m.get('analysis_definition')).toBeUndefined();
          });

          it('should analyse the node', function () {
            expect(this.analysis.analyse).toHaveBeenCalled();
          });

          describe('when yet another node is created on top of the last one', function () {
            beforeEach(function () {
              Backbone.sync.calls.reset();

              this.firstAnalysis = this.collection.first();
              spyOn(this.firstAnalysis, 'save').and.callThrough();

              this.collection.createNode({
                id: 'a2',
                type: 'buffer',
                source_id: 'a1',
                radio: 13
              });
            });

            it('should update the analysis definition model', function () {
              expect(this.collection.length).toEqual(1);
              expect(this.firstAnalysis.save).toHaveBeenCalled();
              expect(this.firstAnalysis.save.calls.argsFor(0)[0]).toEqual({
                node_id: 'a2'
              });
              expect(Backbone.sync).toHaveBeenCalled();
            });

            it('should not update reference until confirmed saved', function () {
              expect(this.firstAnalysis.get('node_id')).toEqual('a1');
            });

            describe('when confirmed analysis is saved', function () {
              beforeEach(function () {
                Backbone.sync.calls.argsFor(0)[2].success({
                  analysis_definition: this.collection.analysisDefinitionNodesCollection.get('a2').toJSON()
                });
              });

              it('should update the existing analysis', function () {
                expect(this.collection.length).toEqual(1);
                expect(this.firstAnalysis.get('node_id')).toEqual('a2');
                expect(this.collection.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'a1', 'a2']);
              });
            });

            describe('when analysis save fails', function () {
              beforeEach(function () {
                Backbone.sync.calls.argsFor(0)[2].error({
                  error: 'something failed, you fool!'
                });
              });

              it('should destroy the new node', function () {
                expect(this.collection.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'a1']);
              });
            });
          });
        });
      });
    });
  });

  describe('when a definition is removed', function () {
    beforeEach(function () {
      spyOn(this.analysis, 'findNodeById');
      this.collection.add({
        analysis_definition: {
          id: 'c3',
          type: 'trade-area'
        }
      }, {
        parse: false,
        silent: true
      });
    });

    describe('when node does not exist', function () {
      it('should not fail', function () {
        this.collection.remove(this.collection.last());
        expect(this.analysis.findNodeById).toHaveBeenCalled();
      });
    });

    describe('when node exists', function () {
      beforeEach(function () {
        this.node = jasmine.createSpyObj('node', ['remove']);
        this.analysis.findNodeById.and.returnValue(this.node);

        this.collection.remove(this.collection.last());
      });

      it('should have removed', function () {
        expect(this.analysis.findNodeById).toHaveBeenCalled();
        expect(this.node.remove).toHaveBeenCalled();
      });
    });
  });
});
