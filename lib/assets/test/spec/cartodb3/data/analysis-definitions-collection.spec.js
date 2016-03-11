var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');

describe('data/analysis-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.collection = new AnalysisDefinitionsCollection(null, {
      vizId: 'v-123',
      configModel: configModel
    });
    spyOn(Backbone, 'sync');
  });

  describe('.url', function () {
    it('should return URL', function () {
      expect(this.collection.url()).toMatch(/\/analyses$/);
    });
  });

  describe('when a source node has been added', function () {
    beforeEach(function () {
      this.collection.analysisDefinitionNodesCollection.add({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM meh'
      }, {
        parse: false
      });
    });

    it('should not create any analysis', function () {
      expect(this.collection.length).toEqual(0);
    });

    describe('when a non-source (e.g. trade-area) node is added on top of the source node', function () {
      beforeEach(function () {
        this.collection.analysisDefinitionNodesCollection.add({
          type: 'trade-area',
          kind: 'bike',
          time: 123,
          source_id: 'a0'
        }, {
          parse: false
        });
      });

      it('should create the analysis, pointing to trade-area node', function () {
        expect(this.collection.length).toEqual(1);

        var m = this.collection.last();
        expect(m.get('node_id')).toEqual('a1');
        expect(m.get('analysis_definition')).toBeUndefined();
      });

      describe('when yet another node is created on top of the last one', function () {
        beforeEach(function () {
          Backbone.sync.calls.reset();
          this.firstAnalysis = this.collection.first();
          spyOn(this.firstAnalysis, 'save').and.callThrough();

          this.collection.analysisDefinitionNodesCollection.add({
            id: 'a2',
            type: 'estimated-population',
            source_id: 'a1',
            column_name: 'col'
          }, {
            parse: false
          });
        });

        it('should update the analysis definition model', function () {
          expect(this.collection.length).toEqual(1);
          expect(this.firstAnalysis.save).toHaveBeenCalled();
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
          });
        });
      });
    });
  });
});
