var _ = require('underscore');
var Backbone = require('backbone');
var deepInsightsIntegrationSpecHelpers = require('./deep-insights-integration-spec-helpers');
var AnalysesIntegration = require('builder/deep-insights-integration/analyses-integration');
var AnalysisOnboardingLauncher = require('builder/components/onboardings/analysis/analysis-launcher');
var Onboardings = {
  create: function () {}
};

describe('deep-insights-integrations/analyses-integration', function () {
  var mapElement;

  beforeAll(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    spyOn(_, 'delay').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });
  });

  beforeEach(function (done) {
    jasmine.Ajax.install();

    // Mock Map instantiation response
    jasmine.Ajax.stubRequest(new RegExp(/api\/v1\/map/)).andReturn({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      responseText: '{ "layergroupid": "123456789", "metadata": { "layers": [] } }'
    });

    var onDashboardCreated = function (dashboard) {
      var fakeObjects = deepInsightsIntegrationSpecHelpers.createFakeObjects(dashboard);
      _.extend(this, fakeObjects);

      spyOn(this.diDashboardHelpers, 'analyse').and.callThrough();
      spyOn(AnalysisOnboardingLauncher, 'launch');

      // Track map integration
      this.integration = AnalysesIntegration.track({
        diDashboardHelpers: this.diDashboardHelpers,
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        analysisDefinitionsCollection: this.analysisDefinitionsCollection,
        analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
        onboardings: Onboardings,
        userModel: new Backbone.Model(),
        visDefinitionModel: new Backbone.Model()
      });

      done();
    }.bind(this);

    mapElement = deepInsightsIntegrationSpecHelpers.createFakeDOMElement();

    deepInsightsIntegrationSpecHelpers.createFakeDashboard(mapElement, onDashboardCreated);
  });

  afterEach(function () {
    this.integration._analysisDefinitionNodesCollection.each(function (analysisDefinitionNode) {
      analysisDefinitionNode.queryRowsCollection.off();
    });

    this.integration._analysisDefinitionsCollection.off();
    this.integration = null;
    document.body.removeChild(mapElement);
    jasmine.Ajax.uninstall();
  });

  describe('when analysis-definition-node is created', function () {
    beforeEach(function () {
      this.a1 = this.analysisDefinitionNodesCollection.add({
        id: 'a1',
        type: 'source',
        params: {
          query: 'SELECT * FROM foobar'
        }
      });
    });

    it('should analyse node', function () {
      expect(this.diDashboardHelpers.analyse).toHaveBeenCalledWith({
        id: 'a1',
        type: 'source',
        params: {
          query: 'SELECT * FROM foobar'
        }
      });
    });

    describe('when changed', function () {
      beforeEach(function () {
        this.diDashboardHelpers.analyse.calls.reset();
        this.a1.set('query', 'SELECT * FROM foobar LIMIT 10');
      });

      it('should analyse node again but with changed query', function () {
        expect(this.diDashboardHelpers.analyse).toHaveBeenCalledWith(
          jasmine.objectContaining({
            params: {
              query: 'SELECT * FROM foobar LIMIT 10'
            }
          })
        );
      });
    });

    describe('when changed only id', function () {
      beforeEach(function () {
        this.diDashboardHelpers.analyse.calls.reset();
        this.a1.set('id', 'b0');
      });

      it('should not analyse node', function () {
        expect(this.diDashboardHelpers.analyse).not.toHaveBeenCalled();
      });

      it('should change the node id in CARTO.js', function () {
        expect(this.diDashboardHelpers.getAnalysisByNodeId('b0')).toBeDefined();
        expect(this.diDashboardHelpers.getAnalysisByNodeId('a1')).not.toBeDefined();
      });
    });

    describe('when changed id and another thing', function () {
      beforeEach(function () {
        this.diDashboardHelpers.analyse.calls.reset();
        this.a1.set({
          id: 'b0',
          query: 'SELECT * FROM whatever'
        });
      });

      it('should analyse node', function () {
        expect(this.diDashboardHelpers.analyse).toHaveBeenCalled();
      });

      it('should change the node id in CARTO.js', function () {
        expect(this.diDashboardHelpers.getAnalysisByNodeId('b0')).toBeDefined();
        expect(this.diDashboardHelpers.getAnalysisByNodeId('a1')).toBeDefined();
      });
    });

    describe('when an analysis-definition is added for source node', function () {
      beforeEach(function () {
        spyOn(this.a1.querySchemaModel, 'set');
        this.analysisDefinitionsCollection.add({analysis_definition: this.a1.toJSON()});
      });

      it('should setup sub-models of node-definition', function () {
        expect(this.a1.querySchemaModel.get('query')).toEqual('SELECT * FROM foobar');
        expect(this.a1.queryGeometryModel.get('query')).toBe('SELECT * FROM foobar');
        expect(this.a1.queryGeometryModel.get('ready')).toBe(true);
      });

      describe('when analysis node has finished executing', function () {
        beforeEach(function () {
          this.diDashboardHelpers.getAnalysisByNodeId('a1').set('status', 'ready');
        });

        it('should not affect the query-schema-model if its a source', function () {
          expect(this.a1.querySchemaModel.set).not.toHaveBeenCalled();
        });
      });

      describe('when analysis-definition-node is removed', function () {
        beforeEach(function () {
          expect(this.diDashboardHelpers.getAnalysisByNodeId('a1')).toBeDefined();
          this.analysisDefinitionNodesCollection.remove(this.a1);
        });

        it('should remove node', function () {
          expect(this.diDashboardHelpers.getAnalysisByNodeId('a1')).toBeUndefined();
        });
      });
    });

    describe('when an analysis definition is added for non-source node', function () {
      beforeEach(function () {
        this.analysisDefinitionsCollection.add({
          analysis_definition: {
            id: 'a2',
            type: 'buffer',
            params: {
              radius: 10,
              source: this.a1.toJSON()
            }
          }
        });
        this.a2 = this.analysisDefinitionNodesCollection.get('a2');
      });

      it('should setup sub-models of node-definition', function () {
        expect(this.a2.querySchemaModel.get('query')).toEqual(undefined);
        expect(this.a2.queryGeometryModel.get('query')).toEqual(undefined);
        expect(this.a2.queryGeometryModel.get('ready')).toBe(false);
      });

      describe('when analysis node has finished executing', function () {
        beforeEach(function () {
          this.node = this.analysisDefinitionNodesCollection.get('a2');
          spyOn(this.node.queryGeometryModel, 'fetch');
          spyOn(this.node.querySchemaModel, 'fetch');
          spyOn(this.node.queryRowsCollection, 'fetch');
          this.node.USER_SAVED = true;
          this.diDashboardHelpers.getAnalysisByNodeId('a2').set({
            query: 'SELECT buffer FROM tmp_result_table_123',
            status: 'ready'
          });
        });

        it('should launch the onboarding analysis if the user saved the node', function () {
          expect(AnalysisOnboardingLauncher.launch).toHaveBeenCalled();
          expect(this.node.USER_SAVED).toBeFalsy();
        });

        it('should launch the onboarding analysis if the analysis is cached', function () {
          expect(AnalysisOnboardingLauncher.launch).toHaveBeenCalled();
          expect(AnalysisOnboardingLauncher.launch.calls.count()).toBe(1);
          expect(this.node.USER_SAVED).toBeFalsy();

          this.node.USER_SAVED = true;
          this.node.set('status', 'launched');
          this.node.set({
            query: 'SELECT buffer FROM tmp_result_table_124',
            status: 'ready'
          });

          expect(AnalysisOnboardingLauncher.launch).toHaveBeenCalledWith('buffer', this.diDashboardHelpers.getAnalysisByNodeId('a2'));
          expect(AnalysisOnboardingLauncher.launch.calls.count()).toBe(2);
          expect(this.node.USER_SAVED).toBeFalsy();
        });
      });

      describe('when analysis node has finished executing', function () {
        beforeEach(function () {
          spyOn(this.a2.queryGeometryModel, 'fetch');
          spyOn(this.a2.querySchemaModel, 'fetch');
          spyOn(this.a2.queryRowsCollection, 'fetch');
          this.diDashboardHelpers.getAnalysisByNodeId('a2').set({
            query: 'SELECT buffer FROM tmp_result_table_123',
            status: 'ready'
          });
        });

        it('should update the sub-models', function () {
          expect(this.a2.querySchemaModel.get('query')).toEqual('SELECT buffer FROM tmp_result_table_123');
          expect(this.a2.queryGeometryModel.get('query')).toEqual('SELECT buffer FROM tmp_result_table_123');
          expect(this.a2.queryGeometryModel.get('ready')).toBe(true);
        });
      });
    });

    describe('queryRowsCollection', function () {
      beforeEach(function () {
        this.a1.queryRowsCollection.reset([{
          c0: 'wadus'
        }, {
          c0: 'foo'
        }], {silent: true});
      });

      it('should reload map when removing a row', function () {
        spyOn(this.diDashboardHelpers, 'invalidateMap');
        var row = this.a1.queryRowsCollection.at(0);
        this.a1.queryRowsCollection.remove(row);
        expect(this.diDashboardHelpers.invalidateMap).toHaveBeenCalled();
      });
    });
  });
});
