var _ = require('underscore');
var Backbone = require('backbone');
var deepInsights = require('cartodb-deep-insights.js');
var DeepInsightsIntegrations = require('../../../javascripts/cartodb3/deep-insights-integrations');
var InfowindowManager = require('../../../javascripts/cartodb3/infowindow-manager');
var LayerDefinitionsCollection = require('../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayerDefinitionModel = require('../../../javascripts/cartodb3/data/layer-definition-model');
var ConfigModel = require('../../../javascripts/cartodb3/data/config-model');

describe('deep-insights-integrations', function () {
  beforeEach(function (done) {
    this.el = document.createElement('div');
    this.el.id = 'wdmtmp';
    document.body.appendChild(this.el);
    var vizjson = {
      bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]],
      center: '[41.40578459184651, 2.2230148315429688]',
      user: {},
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
        operation: 'avg',
        source: 'a0'
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
        operation: 'avg',
        source: {id: 'a0'}
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
      });

      describe('of any normal param', function () {
        beforeEach(function () {
          this.model.set('operation', 'max');
        });

        it('should update the corresponding widget model', function () {
          expect(this.widgetModel.update).toHaveBeenCalled();
          expect(this.widgetModel.update).toHaveBeenCalledWith({ operation: 'max' });
        });
      });

      describe('of the source', function () {
        beforeEach(function () {
          this.model.set({
            operation: 'max',
            source: 'a1'
          });
        });

        it('should maintain normal params but massage the source', function () {
          expect(this.widgetModel.update).toHaveBeenCalled();
          expect(this.widgetModel.update).toHaveBeenCalledWith({
            operation: 'max',
            source: {id: 'a1'}
          });
        });
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

      describe('should create a new widget model for the type', function () {
        beforeEach(function () {
          expect(this.dashboard.createCategoryWidget).toHaveBeenCalled();
          // Same ceation flow as previously tested, so don't test more into detail for now
          expect(this.dashboard.createCategoryWidget).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object));
        });

        it('with new attrs', function () {
          expect(this.dashboard.createCategoryWidget.calls.argsFor(0)[0]).toEqual(
            jasmine.objectContaining({
              id: 'w-100',
              type: 'category',
              source: {id: 'a0'}
            })
          );
        });

        it('with prev layer-defintion', function () {
          expect(this.dashboard.createCategoryWidget.calls.argsFor(0)[1].id).toEqual('l-1');
        });
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

  describe('when a layer is moved', function () {
    beforeEach(function () {
      this.integrations._analysisDefinitionsCollection.findByNodeId = function (whatever) {
        return false;
      };
      this.newLayer = this.layerDefinitionsCollection.add({
        id: 'hello',
        type: 'plain',
        color: 'blue',
        source: 'a0'
      });
    });

    it('should remove model and create a new one with the same id', function () {
      var currentModel = this.integrations._getLayer(this.newLayer);
      this.layerDefinitionsCollection.trigger('layerMoved', this.newLayer, 0);
      var newModel = this.integrations._getLayer(this.newLayer);
      expect(newModel.cid).not.toBe(currentModel.cid);
      expect(newModel.attributes.source).toBeUndefined();
    });

    it('should keep source attribute if there is any associated analysis', function () {
      this.integrations._analysisDefinitionsCollection.findByNodeId = function (whatever) {
        return true;
      };
      this.layerDefinitionsCollection.trigger('layerMoved', this.newLayer, 0);
      var newModel = this.integrations._getLayer(this.newLayer);
      expect(newModel.attributes.source).toBe('a0');
    });
  });

  describe('infowindow manager', function () {
    beforeEach(function () {
      this.configModel = new ConfigModel({
        base_url: '/u/pepe'
      });

      this.layerDefinitionModel = new LayerDefinitionModel({
        id: 'l-1',
        kind: 'carto',
        infowindow: {
          alternative_names: {},
          autoPan: true,
          content: '',
          fields: [],
          headerColor: {},
          latlng: [0, 0],
          maxHeight: 180,
          offset: [28, 0],
          template: '',
          template_name: 'table/views/infowindow_light',
          visibility: false,
          width: 226
        }
      }, {
        parse: true,
        configModel: this.configModel
      });

      this.layerDefinitionsCollection = new LayerDefinitionsCollection(this.layerDefinitionModel, {
        configModel: {},
        analysisDefinitionsCollection: {},
        analysisDefinitionNodesCollection: new Backbone.Collection(),
        mapId: 'map-123',
        basemaps: {}
      });

      this.infowindowManager = new InfowindowManager({
        visMap: this.integrations.visMap(),
        layerDefinitionsCollection: this.layerDefinitionsCollection
      });

      this.infowindowManager.initBinds();

      this.layer = this.integrations.visMap().layers.get(this.layerDefinitionModel.id);
    });

    it('should not show infowindow', function () {
      expect(this.layer.infowindow.get('template')).toEqual('');
    });

    describe('when update infowindow template_name', function () {
      beforeEach(function () {
        this.layerDefinitionModel.infowindowModel.set({
          'template_name': 'infowindow_light',
          'template': '<div class="CDB-infowindow"></div>'
        });
      });

      it('should set none template if infowindow has no fields', function () {
        expect(this.layer.infowindow.get('template')).toContain('You haven’t selected any fields to be shown in the infowindow.');
      });

      it('should update template if infowindow has fields', function () {
        expect(this.layer.infowindow.get('template')).toContain('You haven’t selected any fields to be shown in the infowindow.');

        this.layerDefinitionModel.infowindowModel.set('fields', [
          {
            name: 'description',
            title: true,
            position: 0
          },
          {
            name: 'name',
            title: true,
            position: 1
          }
        ]);

        expect(this.layer.infowindow.get('template')).toEqual('<div class="CDB-infowindow"></div>');
      });

      it('should update template if template changes', function () {
        expect(this.layer.infowindow.get('template')).toContain('You haven’t selected any fields to be shown in the infowindow.');

        this.layerDefinitionModel.infowindowModel.set({
          'fields': [
            {
              name: 'description',
              title: true,
              position: 0
            },
            {
              name: 'name',
              title: true,
              position: 1
            }
          ],
          'template_name': 'infowindow_dark',
          'template': '<div class="CDB-infowindow CDB-infowindow--dark"></div>'
        });

        expect(this.layer.infowindow.get('template')).toEqual('<div class="CDB-infowindow CDB-infowindow--dark"></div>');
      });
    });
  });
});
