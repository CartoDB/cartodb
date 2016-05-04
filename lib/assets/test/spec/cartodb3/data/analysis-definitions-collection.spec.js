var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var createDefaultVis = require('../create-default-vis');

describe('data/analysis-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var vis = createDefaultVis();
    this.analysis = vis.analysis;
    spyOn(this.analysis, 'analyse');

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: {},
      vis: vis
    });

    this.collection = new AnalysisDefinitionsCollection(null, {
      vizId: 'v-123',
      analysis: this.analysis,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
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
      this.res = this.collection.analysisDefinitionNodesCollection.add({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM meh'
      }, {parse: false});
    });

    it('should not create any analysis', function () {
      expect(this.collection.length).toEqual(0);
    });

    it('should return the new node', function () {
      expect(this.res).toBe(this.collection.analysisDefinitionNodesCollection.get('a0'));
    });
  });

  describe('when a definition is removed', function () {
    beforeEach(function () {
      spyOn(this.analysis, 'findNodeById');
      this.collection.add({
        analysis_definition: {
          id: 'c0',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo'
          }
        }
      }, {
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
