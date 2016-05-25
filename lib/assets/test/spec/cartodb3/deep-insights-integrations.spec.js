var _ = require('underscore');
var Backbone = require('backbone');
var deepInsights = require('cartodb-deep-insights.js');
var DeepInsightsIntegrations = require('../../../javascripts/cartodb3/deep-insights-integrations');

describe('deep-insights-integrations', function () {
  beforeEach(function (done) {
    this.el = document.createElement('div');
    this.el.id = 'wdmtmp';
    document.body.appendChild(this.el);
    var vizjson = {
      bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]],
      center: '[41.40578459184651, 2.2230148315429688]',
      user: {},
      center: '[50, 82.5]',
      datasource: {
        maps_api_template: 'asd',
        user_name: 'pepe'
      },
      layers: [{
        id: 'l-1',
        type: 'CartoDB'
      }],
      widgets: []
    };

    deepInsights.createDashboard('#wdmtmp', vizjson, {}, function (error, dashboard) {
      if (error) {
        throw new Error('error creating dashboard ' + error);
      }
      this.dashboard = dashboard;
      this.analysis = this.dashboard.getMap().analysis;

      this.layerDefinitionsCollection = new Backbone.Collection();
      this.widgetDefinitionsCollection = new Backbone.Collection();
      this.analysisDefinitionsCollection = new Backbone.Collection();
      this.analysisDefinitionNodesCollection = new Backbone.Collection();

      this.integrations = new DeepInsightsIntegrations({
        deepInsightsDashboard: dashboard,
        analysisDefinitionsCollection: this.analysisDefinitionsCollection,
        analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        widgetDefinitionsCollection: this.widgetDefinitionsCollection
      });

      // for some reason the spec run gets stuck if done is called within this callback, so defer it to get feedback
      _.defer(function () {
        done();
      });
    }.bind(this));
  });

  afterEach(function () {
    document.body.removeChild(this.el);
  });

  describe('when a widget-definition is created', function () {
    beforeEach(function () {
      spyOn(this.dashboard, 'createFormulaWidget').and.callThrough();
      this.model = this.widgetDefinitionsCollection.add({
        id: 'w-100',
        type: 'formula',
        title: 'avg of something',
        layer_id: 'l-1',
        column: 'col',
        operation: 'avg'
      });
      this.model.trigger('sync', this.model);
    });

    afterEach(function () {
      // delete widget after test case
      this.widgetModel = this.dashboard.getWidget(this.model.id);
      spyOn(this.widgetModel, 'remove').and.callThrough();

      // Fake deletion
      this.model.trigger('destroy', this.model);
      expect(this.widgetModel.remove).toHaveBeenCalled();
    });

    it('should create the corresponding widget model for the dashboard', function () {
      expect(this.dashboard.createFormulaWidget).toHaveBeenCalled();

      var args = this.dashboard.createFormulaWidget.calls.argsFor(0);
      expect(args[0]).toEqual(jasmine.objectContaining({
        title: 'avg of something',
        layer_id: 'l-1',
        column: 'col',
        operation: 'avg'
      }));
      expect(args[1]).toBe(this.integrations.visMap().layers.first());
    });

    it('should enable show_stats for the created widget model', function () {
      var widgetModel = this.dashboard.getWidget(this.model.id);
      expect(widgetModel.get('show_stats')).toBeTruthy();
    });

    describe('when definition changes data', function () {
      beforeEach(function () {
        this.widgetModel = this.dashboard.getWidget(this.model.id);
        spyOn(this.widgetModel, 'update').and.callThrough();

        this.model.set('operation', 'max');
      });

      it('should update the corresponding widget model', function () {
        expect(this.widgetModel.update).toHaveBeenCalled();
        expect(this.widgetModel.update).toHaveBeenCalledWith({ operation: 'max' });
      });
    });

    describe('when definition changes type', function () {
      beforeEach(function () {
        this.widgetModel = this.dashboard.getWidget(this.model.id);
        spyOn(this.widgetModel, 'remove').and.callThrough();
        spyOn(this.dashboard, 'createCategoryWidget').and.callThrough();

        this.model.set('type', 'category');
      });

      it('should remove the corresponding widget model', function () {
        expect(this.widgetModel.remove).toHaveBeenCalled();
      });

      it('should create a new widget model for the type', function () {
        expect(this.dashboard.createCategoryWidget).toHaveBeenCalled();
        // Same ceation flow as previously tested, so don't test more into detail for now
        expect(this.dashboard.createCategoryWidget).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object));
      });

      it('should set show_stats in the new widget model', function () {
        var widgetModel = this.dashboard.getWidget(this.model.id);
        expect(widgetModel.get('show_stats')).toBeTruthy();
      });
    });
  });

  describe('when a new layer is created', function () {
    beforeEach(function () {
      this.layerDefinitionModel = this.layerDefinitionsCollection.add({
        id: 'integration-test',
        type: 'Plain',
        color: 'blue'
      });
    });

    it('should have created the layer', function () {
      var l = this.integrations.visMap().layers.get(this.layerDefinitionModel.id);
      expect(l).toBeDefined();
      expect(l.get('color')).toEqual('blue');
      expect(l.get('type')).toEqual('Plain');
    });

    describe('when update some layer attrs', function () {
      beforeEach(function () {
        this.layerDefinitionModel.set({
          color: 'pink',
          letter: 'c'
        });
      });

      it('should update the equivalent layer', function () {
        var l = this.integrations.visMap().layers.get(this.layerDefinitionModel.id);
        expect(l.get('color')).toEqual('pink');
      });
    });

    describe('when update layer includes change of type', function () {
      beforeEach(function () {
        this.layerBefore = this.integrations.visMap().layers.get(this.layerDefinitionModel.id);
        this.layerDefinitionModel.set({
          type: 'CartoDB',
          table_name: 'my_table',
          cartocss: 'asd',
          sql: 'SELECT * FROM my_table'
        });
        this.layerAfter = this.integrations.visMap().layers.get(this.layerDefinitionModel.id);
      });

      it('should have re-created layer', function () {
        expect(this.layerAfter).not.toBe(this.layerBefore);
        expect(this.layerAfter.get('sql')).toEqual('SELECT * FROM my_table');
        expect(this.layerAfter.get('type')).toEqual('CartoDB');
      });
    });

    describe('when removing layer', function () {
      beforeEach(function () {
        this.layerDefinitionsCollection.remove(this.layerDefinitionModel);
      });

      it('should no longer be accessible', function () {
        expect(this.integrations.visMap().layers.get(this.layerDefinitionModel.id)).toBeUndefined();
      });
    });
  });

  describe('when analysis-definition-node is created', function () {
    beforeEach(function () {
      this.nodeDefModel = this.analysisDefinitionNodesCollection.add({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foobar'
        }
      });
      this.nodeDefModel.querySchemaModel = jasmine.createSpyObj('querySchemaModel', ['set', 'listenTo']);
    });

    describe('when an analysis-definition is added', function () {
      beforeEach(function () {
        this.analysisDefinitionsCollection.add({node_id: 'a0'});
      });

      it('should setup query schema model of node-definition', function () {
        expect(this.nodeDefModel.querySchemaModel.set).toHaveBeenCalled();
        expect(this.nodeDefModel.querySchemaModel.set).toHaveBeenCalledWith({
          query: 'SELECT * FROM foobar',
          may_have_rows: false
        });
      });

      describe('when analysis node has finished executing', function () {
        beforeEach(function () {
          this.nodeDefModel.querySchemaModel.set.calls.reset();
          this.analysis.findNodeById('a0').set('status', 'ready');
        });

        it('should update the query-schema-model', function () {
          expect(this.nodeDefModel.querySchemaModel.set).toHaveBeenCalledWith({
            query: 'SELECT * FROM foobar',
            may_have_rows: true
          });
        });
      });

      describe('when analysis-definition-node is removed', function () {
        beforeEach(function () {
          expect(this.analysis.findNodeById('a0')).toBeDefined();
          this.analysisDefinitionNodesCollection.remove(this.nodeDefModel);
        });

        it('should remove node', function () {
          expect(this.analysis.findNodeById('a0')).toBeUndefined();
        });
      });
    });
  });
});
