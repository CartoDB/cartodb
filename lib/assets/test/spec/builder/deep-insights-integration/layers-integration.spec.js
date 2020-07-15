var _ = require('underscore');
var Backbone = require('backbone');
var deepInsightsIntegrationSpecHelpers = require('./deep-insights-integration-spec-helpers');
var Notifier = require('builder/components/notifier/notifier');
var LayersIntegration = require('builder/deep-insights-integration/layers-integration');
var LegendFactory = require('builder/editor/layers/layer-content-views/legend/legend-factory');
var LayerDefinitionModel = require('builder/data/layer-definition-model');

function flattenObject (object) { // To avoid infinite loop in Jasmine while checking an object with source AnalysisModel against jasmine.objectContaining
  return JSON.parse(JSON.stringify(object));
}

describe('deep-insights-integrations/layers-integration', function () {
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

      spyOn(this.diDashboardHelpers, 'getLayers').and.callThrough();
      spyOn(this.diDashboardHelpers, 'getLayer').and.callThrough();
      LegendFactory.init(this.legendDefinitionsCollection);

      // Track map integration
      this.integration = LayersIntegration.track({
        diDashboardHelpers: this.diDashboardHelpers,
        analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
        editFeatureOverlay: this.editFeatureOverlay,
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        legendDefinitionsCollection: this.legendDefinitionsCollection
      });

      done();
    }.bind(this);

    mapElement = deepInsightsIntegrationSpecHelpers.createFakeDOMElement();

    deepInsightsIntegrationSpecHelpers.createFakeDashboard(mapElement, onDashboardCreated);
  });

  afterEach(function () {
    this.integration._layerDefinitionsCollection.off();
    this.integration = null;
    document.body.removeChild(mapElement);
    jasmine.Ajax.uninstall();
  });

  describe('when a new layer definition model is created', function () {
    beforeEach(function () {
      this.layerDefinitionModel = this.layerDefinitionsCollection.add({
        id: 'integration-test',
        kind: 'carto',
        options: {
          sql: 'SELECT * FROM bar',
          cartocss: 'CARTO_CSS',
          source: 'a0',
          table_name: 'bar',
          table_name_alias: 'My BAR'
        },
        legends: {}
      }, { at: 1 }); // <- this is what actually determines the right order

      this.cartodbjsMap = this.diDashboardHelpers.visMap();
      spyOn(this.cartodbjsMap, 'createCartoDBLayer');
      spyOn(this.cartodbjsMap, 'createTorqueLayer');

      this.cdbjsLayer = new Backbone.Model();
      this.cdbjsLayer.update = jasmine.createSpy('update');
      this.cdbjsLayer.remove = jasmine.createSpy('remove');
      this.cdbjsLayer.setSource = jasmine.createSpy('setSource');

      this.diDashboardHelpers.getLayer.and.callFake(function (layerId) {
        if (layerId === 'integration-test') {
          return this.cdbjsLayer;
        }
      }.bind(this));
    });

    it('should create the CartoDB.js layer at the given position (order)', function () {
      this.layerDefinitionsCollection.add({
        id: 'integration-test-2',
        kind: 'carto',
        options: {
          sql: 'SELECT * FROM foo',
          cartocss: 'CARTO_CSS',
          source: 'a0'
        }
      }, { at: 1 }); // <- this is what actually determines the right order

      expect(this.cartodbjsMap.createCartoDBLayer).toHaveBeenCalled();

      var args = this.cartodbjsMap.createCartoDBLayer.calls.argsFor(0);
      var flattenedObject = flattenObject(args[0]);
      expect(flattenedObject).toEqual(jasmine.objectContaining({
        id: 'integration-test-2',
        sql: 'SELECT * FROM foo',
        cartocss: 'CARTO_CSS',
        order: 1,
        type: 'CartoDB'
      }));
      expect(flattenedObject.source).toBeDefined();
      expect(flattenedObject.source.id).toEqual('a0');
      expect(args[1]).toEqual({ at: 1 });
    });

    it('should update the CartoDB.js layer at the right position', function () {
      var collection = new Backbone.Collection([new Backbone.Model(), this.cdbjsLayer, new Backbone.Model(), new Backbone.Model()]);
      spyOn(this.diDashboardHelpers, 'moveCartoDBLayer');
      this.diDashboardHelpers.getLayers.and.returnValue(collection);
      this.diDashboardHelpers.getLayer.and.returnValue(this.cdbjsLayer);

      this.layerDefinitionsCollection.remove(this.layerDefinitionModel);

      this.layerDefinitionsCollection.add({
        id: 'integration-test-2',
        kind: 'carto',
        options: {
          sql: 'SELECT * FROM foo',
          cartocss: 'CARTO_CSS',
          source: 'a0'
        }
      }, { at: 1 });

      this.layerDefinitionsCollection.add(this.layerDefinitionModel, { at: 2 });

      expect(this.diDashboardHelpers.moveCartoDBLayer).toHaveBeenCalledWith(1, 2);
    });

    describe('when the layer definition model is updated', function () {
      beforeEach(function () {
        this.layerDefinitionModel.set({
          sql: 'SELECT * FROM bar LIMIT 10',
          cartocss: 'NEW_CARTO_CSS'
        });
      });

      it('should update the CartoDB.js layer', function () {
        expect(this.cdbjsLayer.update).toHaveBeenCalledWith({
          sql: 'SELECT * FROM bar LIMIT 10',
          cartocss: 'NEW_CARTO_CSS'
        }, { silent: false });
      });
    });

    describe('when layer type is changed to torque', function () {
      beforeEach(function () {
        this.callback = jasmine.createSpy('hello');
        spyOn(this.integration, 'trigger');
        this.layerDefinitionModel.set('type', 'torque');
      });

      it('should have re-created the layer', function () {
        expect(this.cdbjsLayer.remove).toHaveBeenCalled();
        expect(this.cartodbjsMap.createTorqueLayer).toHaveBeenCalled();

        var args = this.cartodbjsMap.createTorqueLayer.calls.argsFor(0);
        var flattenedObject = flattenObject(args[0]);
        expect(flattenedObject).toEqual(jasmine.objectContaining({
          id: 'integration-test',
          sql: 'SELECT * FROM bar',
          cartocss: 'CARTO_CSS',
          table_name: 'bar',
          table_name_alias: 'My BAR',
          autoStyle: false,
          order: 1,
          type: 'torque',
          layer_name: 'My BAR'
        }));
        expect(flattenedObject.source).toBeDefined();
        expect(flattenedObject.source.id).toEqual('a0');
        expect(args[1]).toEqual({ at: 1 });
      });

      it('should trigger an event in order to manage time-series widget', function () {
        expect(this.integration.trigger).toHaveBeenCalledWith('onLayerChanged', this.layerDefinitionModel);
      });
    });

    describe('when layer has a source attribute here and not in CartoDB.js', function () {
      it('should set the source attribute', function () {
        spyOn(this.layerDefinitionModel, 'isNew').and.returnValue(false);

        // Imagine CartoDB.js returns a layer with no source
        this.cdbjsLayer.set({
          id: 'integration-test',
          type: 'CartoDB',
          order: 1,
          visible: true,
          cartocss: 'cartoCSS',
          cartocss_version: '2.1.1',
          sql: 'SELECT * FROM test'
        });

        // Change some attributes in the definition model
        this.cdbjsLayer.update.calls.reset();
        this.layerDefinitionModel.set({
          cartocss: 'a different CartoCSS'
        });

        // The CartoDB.js layer has been set a new source
        var setSourceCallArgs = this.cdbjsLayer.setSource.calls.mostRecent().args;
        expect(setSourceCallArgs[0].id).toEqual('a0');
        expect(setSourceCallArgs[0].id).toBeDefined();
        expect(setSourceCallArgs[1]).toEqual({ silent: true });

        var args = this.cdbjsLayer.setSource.calls.argsFor(0);
        var flattenAttrs = flattenObject(args[0].attributes);
        expect(flattenAttrs).toEqual(jasmine.objectContaining({
          id: 'a0',
          type: 'source',
          options: {
            table_name: 'world_borders',
            simple_geom: 'polygon'
          }
        }));

        // The CartoDB.js layer has been updated without source attribute
        expect(this.cdbjsLayer.update).toHaveBeenCalledWith({
          cartocss: 'a different CartoCSS'
        }, { silent: false });
      });
    });

    describe('when removing layer', function () {
      beforeEach(function () {
        this.layerDefinitionsCollection.remove(this.layerDefinitionModel);
      });

      it('cartodb.js layer should be removed too', function () {
        expect(this.cdbjsLayer.remove).toHaveBeenCalled();
      });
    });
  });

  describe('when the base layer has changed', function () {
    beforeEach(function () {
      this.layerDefinitionsCollection.reset([
        {
          order: 0,
          id: 'layer-id',
          type: 'Tiled',
          default: true,
          urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
          subdomains: 'abcd',
          minZoom: '0',
          maxZoom: '18',
          name: 'Positron',
          className: 'positron_rainbow_labels',
          attribution: '© <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors © <a href=\'https://carto.com/about-carto/\'>CARTO</a>'
        }
      ], { parse: false });

      this.cdbjsMap = this.diDashboardHelpers.visMap();
      spyOn(this.cdbjsMap, 'set');
      spyOn(this.cdbjsMap, 'createTileLayer');
      spyOn(this.cdbjsMap, 'createPlainLayer');
      spyOn(this.cdbjsMap, 'createGMapsBaseLayer');

      this.cdbjsLayer = new Backbone.Model();
      this.cdbjsLayer.update = jasmine.createSpy('update');
      this.cdbjsLayer.remove = jasmine.createSpy('remove');

      spyOn(this.cdbjsMap.layers, 'get').and.returnValue(this.cdbjsLayer);
    });

    it('should re-create the cdb.js layer if type has changed', function () {
      this.layerDefinitionsCollection.at(0).attributes = _.pick(this.layerDefinitionsCollection.attributes, 'type');
      this.layerDefinitionsCollection.at(0).set({
        id: 'baseLayer',
        type: 'Plain',
        color: '#FABADA',
        order: 0
      });

      this.layerDefinitionsCollection.trigger('baseLayerChanged');
      expect(this.cdbjsLayer.remove).toHaveBeenCalled();
      expect(this.cdbjsMap.createPlainLayer).toHaveBeenCalledWith({
        id: 'baseLayer',
        type: 'Plain',
        color: '#FABADA',
        order: 0
      }, { at: 0, silent: false });
    });

    it('should update the cdb.js layer if type has NOT changed', function () {
      this.layerDefinitionsCollection.at(0).set({
        urlTemplate: 'newURLTemplate'
      });

      this.layerDefinitionsCollection.trigger('baseLayerChanged');

      expect(this.cdbjsLayer.update).toHaveBeenCalledWith({
        urlTemplate: 'newURLTemplate'
      }, { silent: false });
    });

    it('should change the map provider', function () {
      this.layerDefinitionsCollection.at(0).attributes = _.pick(this.layerDefinitionsCollection.attributes, 'type');
      this.layerDefinitionsCollection.at(0).set({
        name: 'GMaps Hybrid',
        maxZoom: 40,
        minZoom: 0,
        baseType: 'hybrid',
        className: 'googlemaps',
        style: '[]',
        type: 'GMapsBase'
      });

      this.layerDefinitionsCollection.trigger('baseLayerChanged');

      expect(this.cdbjsMap.set).toHaveBeenCalledWith('provider', 'googlemaps');
    });

    describe('if new new base layer has labels', function () {
      beforeEach(function () {
        this.layerDefinitionsCollection.resetByLayersData([
          {
            'id': 'baseLayer',
            'options': {
              'type': 'Tiled',
              'urlTemplate': 'urlTemplate'
            },
            'kind': 'tiled',
            'order': 0
          },
          {
            'id': 'labelsLayer',
            'options': {
              'type': 'Tiled',
              'urlTemplate': 'urlTemplate2'
            },
            'kind': 'tiled',
            'order': 1
          }
        ]);

        this.cdbjsLayer = new Backbone.Model({ id: 'baseLayer' });
        this.cdbjsLayer.update = jasmine.createSpy('update');
        this.cdbjsLayer.remove = jasmine.createSpy('remove');
      });

      describe('if cdb.js has a layer with labels', function () {
        beforeEach(function () {
          this.cdbjsLabelsLayer = new Backbone.Model({ type: 'Tiled' });
          this.cdbjsLabelsLayer.update = jasmine.createSpy('update');
          this.cdbjsLabelsLayer.remove = jasmine.createSpy('remove');

          this.diDashboardHelpers.getLayers.and.returnValue(new Backbone.Collection([
            this.cdbjsLayer,
            this.cdbjsLabelsLayer
          ]));

          this.diDashboardHelpers.getLayer.and.callFake(function (layerId) {
            if (this.layerDefinitionsCollection.at(0).id === layerId) {
              return this.cdbjsLayer;
            }
            if (this.layerDefinitionsCollection.at(1).id === layerId) {
              return this.cdbjsLabelsLayer;
            }
          }.bind(this));
        });

        it('should update the cdb.js labels layer when something changes', function () {
          this.layerDefinitionsCollection.at(1).set({
            urlTemplate: 'urlTemplate3'
          });
          this.layerDefinitionsCollection.trigger('baseLayerChanged');

          expect(this.cdbjsLabelsLayer.update).toHaveBeenCalledWith({
            urlTemplate: 'urlTemplate3'
          }, { silent: false });
        });
      });

      describe('if cdb.js does NOT have a layer with labels', function () {
        beforeEach(function () {
          this.diDashboardHelpers.getLayers.and.returnValue(new Backbone.Collection([
            this.cdbjsLayer
          ]));

          this.diDashboardHelpers.getLayer.and.callFake(function (layerId) {
            if (this.layerDefinitionsCollection.at(0).id === layerId) {
              return this.cdbjsLayer;
            }
          }.bind(this));
        });

        it('should create the cdb.js labels layer', function () {
          this.layerDefinitionsCollection.trigger('baseLayerChanged');

          expect(this.cdbjsMap.createTileLayer).toHaveBeenCalledWith({
            id: 'labelsLayer',
            order: 1,
            type: 'Tiled',
            urlTemplate: 'urlTemplate2'
          }, { at: 1, silent: false });
        });
      });
    });

    describe('if new new base layer does NOT have labels', function () {
      beforeEach(function () {
        this.layerDefinitionsCollection.resetByLayersData([
          {
            'id': 'baseLayer',
            'options': {
              'type': 'Tiled',
              'urlTemplate': 'urlTemplate'
            },
            'kind': 'tiled',
            'order': 0
          }
        ]);

        this.cdbjsLayer = new Backbone.Model({ id: 'baseLayer' });
        this.cdbjsLayer.update = jasmine.createSpy('update');
        this.cdbjsLayer.remove = jasmine.createSpy('remove');
      });

      describe('if cdb.js has a layer with labels', function () {
        beforeEach(function () {
          this.cdbjsLabelsLayer = new Backbone.Model({ type: 'Tiled' });
          this.cdbjsLabelsLayer.update = jasmine.createSpy('update');
          this.cdbjsLabelsLayer.remove = jasmine.createSpy('remove');

          this.diDashboardHelpers.getLayers.and.returnValue(new Backbone.Collection([
            this.cdbjsLayer,
            this.cdbjsLabelsLayer
          ]));

          this.diDashboardHelpers.getLayer.and.callFake(function (layerId) {
            if (this.layerDefinitionsCollection.at(0).id === layerId) {
              return this.cdbjsLayer;
            }
            if (this.layerDefinitionsCollection.at(1).id === layerId) {
              return this.cdbjsLabelsLayer;
            }
          }.bind(this));
        });

        it('should remove the cdb.js labels layer', function () {
          this.layerDefinitionsCollection.trigger('baseLayerChanged');
          expect(this.cdbjsLabelsLayer.remove).toHaveBeenCalledWith({ silent: false });
        });
      });
    });
  });

  describe('when a layer is moved', function () {
    it('should invoke moveCartoDBLayer function in CartoDB.js', function () {
      spyOn(this.diDashboardHelpers, 'moveCartoDBLayer');
      this.layerDefinitionsCollection.trigger('layerMoved', this.layerDefinitionsCollection.at(0), 0, 1);
      expect(this.diDashboardHelpers.moveCartoDBLayer).toHaveBeenCalledWith(0, 1);
    });
  });

  describe('.infowindow', function () {
    beforeEach(function () {
      this.cdbLayer = this.diDashboardHelpers.getLayers().at(0);
    });

    it('should not show infowindow', function () {
      expect(this.cdbLayer.infowindow.get('visibility')).toBeFalsy();
    });

    describe('w/o fields', function () {
      beforeEach(function () {
        this.cdbLayer.infowindow = jasmine.createSpyObj('infowindow', ['update']);
      });

      describe('when template is changed', function () {
        beforeEach(function () {
          this.layerDefinitionsCollection.at(0).infowindowModel.set({
            template_name: 'infowindow_light',
            template: '<div class="CDB-infowindow"></div>'
          });
        });

        it('should set a "none" template', function () {
          expect(this.cdbLayer.infowindow.update).toHaveBeenCalledWith({
            alternative_names: jasmine.any(Object),
            autoPan: true,
            content: '',
            fields: [],
            headerColor: jasmine.any(Object),
            latlng: [0, 0],
            maxHeight: 180,
            offset: [28, 0],
            template: '<div class="CDB-infowindow"></div>',
            template_name: 'infowindow_light',
            visibility: false,
            width: 226
          });
        });
      });
    });

    describe('w/ fields', function () {
      beforeEach(function () {
        this.layerDefinitionsCollection.at(0).infowindowModel.set({
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
          ]
        });

        this.cdbLayer.infowindow = jasmine.createSpyObj('infowindow', ['update']);
      });

      describe('when template is changed', function () {
        beforeEach(function () {
          this.layerDefinitionsCollection.at(0).infowindowModel.set({
            'template_name': 'infowindow_light',
            'template': '<div class="CDB-infowindow"></div>'
          });
        });

        it('should update template', function () {
          expect(this.cdbLayer.infowindow.update).toHaveBeenCalledWith({
            alternative_names: {},
            autoPan: true,
            content: '',
            fields: [
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
            headerColor: {},
            latlng: [0, 0],
            maxHeight: 180,
            offset: [28, 0],
            template_name: 'infowindow_light',
            template: '<div class="CDB-infowindow"></div>',
            visibility: false,
            width: 226
          });
        });
      });

      describe('when both template and fields are changed', function () {
        beforeEach(function () {
          this.layerDefinitionsCollection.at(0).infowindowModel.set({
            'fields': [
              {
                name: 'description',
                title: true,
                position: 1
              },
              {
                name: 'name',
                title: true,
                position: 0
              }
            ],
            'template_name': 'infowindow_dark',
            'template': '<div class="CDB-infowindow CDB-infowindow--dark"></div>'
          });
        });

        it('should update fields and template', function () {
          expect(this.cdbLayer.infowindow.update).toHaveBeenCalledWith({
            alternative_names: {},
            autoPan: true,
            content: '',
            fields: [
              {
                name: 'description',
                title: true,
                position: 1
              },
              {
                name: 'name',
                title: true,
                position: 0
              }
            ],
            headerColor: {},
            latlng: [0, 0],
            maxHeight: 180,
            offset: [28, 0],
            template: '<div class="CDB-infowindow CDB-infowindow--dark"></div>',
            template_name: 'infowindow_dark',
            visibility: false,
            width: 226
          });
        });
      });
    });
  });

  describe('"syncing" of errors coming from cartodb.js models', function () {
    var obj = {};
    var mapEl;

    beforeEach(function (done) {
      spyOn(deepInsightsIntegrationSpecHelpers, 'createLayersData').and.returnValue(
        [deepInsightsIntegrationSpecHelpers.createErrorLayerData()]
      );

      var onDashboardCreated = function (dashboard) {
        deepInsightsIntegrationSpecHelpers.createLayersData.and.returnValue(
          [deepInsightsIntegrationSpecHelpers.createLayerData()]
        );
        var fakeObjects = deepInsightsIntegrationSpecHelpers.createFakeObjects(dashboard);

        _.extend(obj, fakeObjects);

        obj.cdbLayer = obj.diDashboardHelpers.getLayers().at(0);
        obj.cdbLayer.infowindow = jasmine.createSpyObj('infowindow', ['update']);

        // Track map integration
        obj.integration = LayersIntegration.track({
          diDashboardHelpers: obj.diDashboardHelpers,
          analysisDefinitionNodesCollection: obj.analysisDefinitionNodesCollection,
          editFeatureOverlay: obj.editFeatureOverlay,
          layerDefinitionsCollection: obj.layerDefinitionsCollection,
          legendDefinitionsCollection: obj.legendDefinitionsCollection
        });

        done();
      };

      mapEl = deepInsightsIntegrationSpecHelpers.createFakeDOMElement();

      deepInsightsIntegrationSpecHelpers.createFakeDashboard(mapEl, onDashboardCreated);
    });

    afterEach(function () {
      document.body.removeChild(mapEl);
    });

    it('should set turbo-carto errors on the layerDefinitionModel if CartoDB.js layer had an error', function () {
      expect(obj.layerDefinitionsCollection.at(0).get('error')).toEqual({
        type: 'layer',
        subtype: 'turbo-carto',
        line: 99,
        message: 'something went wrong'
      });
    });

    it('should set turbo-carto errors on the layerDefinitionModel if CartoDB.js layer gets new errors', function () {
      obj.cdbLayer.set('error', {
        type: 'layer',
        subtype: 'turbo-carto',
        context: {
          source: {
            start: {
              line: 199
            }
          }
        },
        message: 'something went totally wrong'
      });

      expect(obj.layerDefinitionsCollection.at(0).get('error')).toEqual({
        type: 'layer',
        subtype: 'turbo-carto',
        line: 199,
        message: 'something went totally wrong'
      });
    });

    it('should add an error in the notifier with the same id as the layer', function () {
      var notifications = Notifier.getCollection();
      var notification = notifications.pop();
      expect(notification.id).toBe('l-1');
      expect(notification.get('status')).toBe('error');
      expect(notification.get('info')).toBe('world_borders: something went wrong');
    });
  });

  describe('_resetStylesIfNoneApplied', function () {
    beforeEach(function () {
      this.layerDefModel = new LayerDefinitionModel({
        id: 'l-3',
        kind: 'carto',
        options: {
          sql: 'SELECT * FROM fooo',
          table_name: 'fooo',
          cartocss: '...',
          source: 'd1',
          style_properties: {
            type: 'none',
            properties: {}
          }
        }
      }, { parse: true, configModel: 'c' });

      this.d0 = this.analysisDefinitionNodesCollection.add({
        id: 'd0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foobar'
        }
      });

      this.d1 = this.analysisDefinitionNodesCollection.add({
        id: 'd1',
        type: 'buffer',
        params: {
          radius: 10,
          source: { id: 'd0' }
        }
      });

      // We have to add the analysis to CARTO.js manually due to that behaviour
      // is in other integration

      var nodeMod = this.diDashboardHelpers.analyse(this.d1.toJSON());

      this.layerDefinitionsCollection.add(this.layerDefModel);

      spyOn(nodeMod, 'isDone');
      var nodeDef = this.layerDefModel.getAnalysisDefinitionNodeModel();
      nodeDef.queryGeometryModel.set('simple_geom', 'point', { silent: true });
      spyOn(this.layerDefModel.styleModel, 'setDefaultPropertiesByType').and.callThrough();
    });

    it('should not reset styles if layer doesn\'t have none styles', function () {
      this.layerDefModel.styleModel.set('type', 'simple', { silent: true });
      this.integration._resetStylesIfNoneApplied(this.layerDefModel);
      expect(this.layerDefModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
    });

    it('should not reset styles if node definition has not finished', function () {
      var nodeMod = this.diDashboardHelpers.getAnalysisByNodeId('d1');
      nodeMod.isDone.and.returnValue(false);
      this.integration._resetStylesIfNoneApplied(this.layerDefModel);
      expect(this.layerDefModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
    });

    it('should not reset styles if node type is source', function () {
      var nodeMod = this.diDashboardHelpers.getAnalysisByNodeId('d1');
      nodeMod.set('type', 'source');
      this.integration._resetStylesIfNoneApplied(this.layerDefModel);
      expect(this.layerDefModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
    });

    it('should fetch geometry if it is not defined until reset styles', function () {
      var nodeDef = this.layerDefModel.getAnalysisDefinitionNodeModel();
      var nodeMod = this.diDashboardHelpers.getAnalysisByNodeId('d1');
      nodeDef.queryGeometryModel.set('simple_geom', '', { silent: true });
      nodeMod.isDone.and.returnValue(true);
      spyOn(nodeDef.queryGeometryModel, 'fetch').and.callFake(function () {
        nodeDef.queryGeometryModel.set('simple_geom', 'polygon', { silent: true });
      });

      this.integration._resetStylesIfNoneApplied(this.layerDefModel);
      expect(nodeDef.queryGeometryModel.fetch).toHaveBeenCalled();
      expect(this.layerDefModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
    });

    it('should reset styles if layer has none styles', function () {
      var nodeMod = this.diDashboardHelpers.getAnalysisByNodeId('d1');
      nodeMod.isDone.and.returnValue(true);
      expect(this.layerDefModel.styleModel.hasNoneStyles()).toBeTruthy();
      this.integration._resetStylesIfNoneApplied(this.layerDefModel);
      expect(this.layerDefModel.styleModel.setDefaultPropertiesByType).toHaveBeenCalled();
      expect(this.layerDefModel.styleModel.hasNoneStyles()).toBeFalsy();
    });
  });

  describe('time series', function () {
    var xhrSpy = jasmine.createSpyObj('xhr', ['abort', 'always', 'fail']);

    var cartocss = 'Map {-torque-frame-count: 256;-torque-animation-duration: 30;-torque-time-attribute: cartodb_id";-torque-aggregation-function: "count(1)";-torque-resolution: 4;-torque-data-aggregation: linear;} #layer {}, #layer[frame-offset=1] {marker-width: 9; marker-fill-opacity: 0.45;} #layer[frame-offset=2] {marker-width: 11; marker-fill-opacity: 0.225;}';

    var animatedChanged = {attribute: 'cartodb_id', duration: 24, overlap: false, resolution: 4, steps: 256, trails: 2};

    beforeEach(function () {
      spyOn(Backbone.Model.prototype, 'sync').and.returnValue(xhrSpy);

      this.layerDefModel = new LayerDefinitionModel({
        id: 'wadus',
        kind: 'torque',
        options: {
          tile_style: cartocss,
          query: 'SELECT * FROM fooo',
          table_name: 'fooo',
          source: 'd0',
          style_properties: {
            type: 'animation',
            properties: {
              animated: {
                attribute: 'cartodb_id',
                duration: 30,
                overlap: false,
                resolution: 4,
                steps: 256,
                trails: 2
              }
            }
          }
        }
      }, { parse: true, configModel: 'c' });

      this.d0 = this.analysisDefinitionNodesCollection.add({
        id: 'd0',
        type: 'source',
        params: {
          query: 'SELECT * FROM fooo'
        }
      });

      var nodeMod = this.diDashboardHelpers.analyse(this.d0.toJSON());

      this.layerDefinitionsCollection.add(this.layerDefModel);

      // We have to add the analysis and the layer manually due to in this class
      // there is no bindings for those purposes (layers-integration will have it)
      var visMap = this.diDashboardHelpers.visMap();
      var attrs = this.layerDefModel.toJSON();
      attrs.source = nodeMod;
      attrs.cartocss = attrs.options.tile_style;
      visMap.createTorqueLayer(attrs, _.extend({
        at: 0
      }));

      spyOn(nodeMod, 'isDone');
    });

    it('should create time-series widget on layer changes', function () {
      var l = this.diDashboardHelpers.getLayer(this.layerDefModel.id);
      spyOn(this.integration, 'trigger').and.callThrough();

      expect(l).toBeDefined();
      this.layerDefModel.styleModel.set({animated: animatedChanged});
      this.layerDefModel.set({alias: 'wadus'});

      expect(this.integration.trigger).toHaveBeenCalledWith('onLayerChanged', this.layerDefModel);
    });
  });
});
