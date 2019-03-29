var _ = require('underscore');
var Backbone = require('backbone');
var deepInsightsIntegrationSpecHelpers = require('./deep-insights-integration-spec-helpers');
var WidgetsIntegration = require('builder/deep-insights-integration/widgets-integration');
var WidgetsService = require('builder/editor/widgets/widgets-service');
var LayerDefinitionModel = require('builder/data/layer-definition-model');

function flattenObject (object) { // To avoid infinite loop in Jasmine while checking an object with source AnalysisModel against jasmine.objectContaining
  return JSON.parse(JSON.stringify(object));
}

describe('deep-insights-integrations/widgets-integration', function () {
  var mapElement;
  var setSelectedSpy;

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

      spyOn(this.diDashboardHelpers.getDashboard(), 'onStateChanged').and.callThrough();
      spyOn(this.stateDefinitionModel, 'updateState');
      spyOn(WidgetsIntegration, '_invalidateSize');
      setSelectedSpy = spyOn(WidgetsIntegration, '_setSelectedWidget');

      // Track map integration
      this.integration = WidgetsIntegration.track({
        diDashboardHelpers: this.diDashboardHelpers,
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        widgetDefinitionsCollection: this.widgetDefinitionsCollection,
        analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection
      });

      done();
    }.bind(this);

    mapElement = deepInsightsIntegrationSpecHelpers.createFakeDOMElement();

    deepInsightsIntegrationSpecHelpers.createFakeDashboard(mapElement, onDashboardCreated);
  });

  afterEach(function () {
    this.integration._widgetDefinitionsCollection.off();
    this.integration = null;
    document.body.removeChild(mapElement);
    jasmine.Ajax.uninstall();
  });

  describe('when a widget-definition is created', function () {
    beforeEach(function () {
      spyOn(this.integration, '_bindWidgetChanges').and.callThrough();
      spyOn(this.diDashboardHelpers.getDashboard(), 'createFormulaWidget').and.callThrough();
      spyOn(WidgetsService, 'editWidget');
      spyOn(WidgetsService, 'removeWidget');

      this.model = this.widgetDefinitionsCollection.add({
        id: 'w-100',
        type: 'formula',
        title: 'avg of something',
        layer_id: 'l-1',
        source: {
          id: 'a0'
        },
        options: {
          column: 'col',
          operation: 'avg'
        }
      });
      this.model.trigger('sync', this.model);
    });

    afterEach(function () {
      // delete widget after test case
      this.widgetModel = this.diDashboardHelpers.getWidget(this.model.id);
      spyOn(this.widgetModel, 'remove').and.callThrough();

      // Fake deletion
      this.model.trigger('destroy', this.model);
      expect(this.widgetModel.remove).toHaveBeenCalled();
    });

    it('should bind widgets changes', function () {
      expect(this.integration._bindWidgetChanges).toHaveBeenCalled();
    });

    it('should call widgets service properly', function () {
      var widget = this.diDashboardHelpers.getWidget(this.model.id);
      widget.trigger('editWidget', widget);
      expect(WidgetsService.editWidget).toHaveBeenCalled();

      widget.trigger('removeWidget', widget);
      expect(WidgetsService.removeWidget).toHaveBeenCalled();
    });

    it('should create the corresponding widget model for the dashboard', function () {
      expect(this.diDashboardHelpers.getDashboard().createFormulaWidget).toHaveBeenCalled();

      var args = this.diDashboardHelpers.getDashboard().createFormulaWidget.calls.argsFor(0);
      var flattenedObject = flattenObject(args[0]);
      expect(flattenedObject).toEqual(jasmine.objectContaining({
        title: 'avg of something',
        layer_id: 'l-1',
        column: 'col',
        operation: 'avg'
      }));
      expect(flattenedObject.source).toBeDefined();
      expect(flattenedObject.source.id).toEqual('a0');
      expect(args[1]).toBe(this.diDashboardHelpers.getLayers().first());
    });

    it('should enable show_stats and show_options for the created widget model', function () {
      var widgetModel = this.diDashboardHelpers.getWidget(this.model.id);
      expect(widgetModel.get('show_stats')).toBeTruthy();
      expect(widgetModel.get('show_options')).toBeTruthy();
    });

    describe('when definition changes data', function () {
      beforeEach(function () {
        this.widgetModel = this.diDashboardHelpers.getWidget(this.model.id);
        spyOn(this.widgetModel, 'update');
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
          spyOn(this.diDashboardHelpers, 'getAnalysisByNodeId').and.returnValue({
            id: 'a1',
            cid: 'c808'
          });
          this.model.set({
            operation: 'max',
            source: 'a1'
          });
        });

        it('should maintain normal params but massage the source', function () {
          expect(this.widgetModel.update).toHaveBeenCalledWith({
            operation: 'max',
            source: {
              id: 'a1',
              cid: 'c808'
            }
          });
        });
      });

      describe('color', function () {
        it('should set widget color changed to true', function () {
          expect(this.model.get('widget_color_changed')).toBe(false);
          this.model.set({
            widget_style_definition: {
              color: {
                fixed: '#fabada',
                opacity: 1
              }
            }
          });
          expect(this.model.get('widget_color_changed')).toBe(true);
        });
      });
    });

    describe('when definition changes type', function () {
      beforeEach(function () {
        this.widgetModel = this.diDashboardHelpers.getWidget(this.model.id);
        spyOn(this.widgetModel, 'remove').and.callThrough();
        spyOn(this.diDashboardHelpers.getDashboard(), 'createCategoryWidget').and.callThrough();

        this.model.set('type', 'category');
      });

      it('should remove the corresponding widget model', function () {
        expect(this.widgetModel.remove).toHaveBeenCalled();
      });

      describe('should create a new widget model for the type', function () {
        beforeEach(function () {
          expect(this.diDashboardHelpers.getDashboard().createCategoryWidget).toHaveBeenCalled();
          // Same ceation flow as previously tested, so don't test more into detail for now
          expect(this.diDashboardHelpers.getDashboard().createCategoryWidget).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object));
        });

        it('with new attrs', function () {
          var widget = this.diDashboardHelpers.getDashboard().createCategoryWidget.calls.argsFor(0)[0];
          var flattenedWidget = flattenObject(widget);
          expect(flattenedWidget).toEqual(
            jasmine.objectContaining({
              id: 'w-100',
              type: 'category'
            })
          );
          expect(flattenedWidget.source).toBeDefined();
          expect(flattenedWidget.source.id).toEqual('a0');
        });

        it('with prev layer-defintion', function () {
          expect(this.diDashboardHelpers.getDashboard().createCategoryWidget.calls.argsFor(0)[1].id).toEqual('l-1');
        });
      });

      it('should set show_stats in the new widget model', function () {
        var widgetModel = this.diDashboardHelpers.getDashboard().getWidget(this.model.id);
        expect(widgetModel.get('show_stats')).toBeTruthy();
      });
    });
  });

  describe('autoStyle', function () {
    var category;
    var histogram;
    var layerDefinitionModel;
    var nodeDefinitionModel;
    var originalAjax;

    beforeEach(function () {
      originalAjax = Backbone.ajax;
      Backbone.ajax = function () {
        return {
          always: function (cb) {
            cb();
          }
        };
      };

      this.a0 = this.analysisDefinitionNodesCollection.add({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foobar'
        }
      });

      var nodeMod = this.diDashboardHelpers.analyse(this.a0.toJSON());

      layerDefinitionModel = this.layerDefinitionsCollection.add({
        id: 'integration-test',
        kind: 'carto',
        options: {
          table_name: 'something',
          cartocss: '#layer {}',
          source: 'a0',
          tile_style: '#layer {}'
        }
      });

      // We have to add the analysis and the layer manually due to in this class
      // there is no bindings for those purposes (layers-integration will have it)
      var visMap = this.diDashboardHelpers.visMap();
      var attrs = layerDefinitionModel.toJSON();
      attrs.source = nodeMod;
      attrs.cartocss = attrs.options.tile_style;
      visMap.createCartoDBLayer(attrs);

      spyOn(layerDefinitionModel.styleModel, 'resetPropertiesFromAutoStyle').and.callThrough();
      spyOn(layerDefinitionModel.styleModel, 'setPropertiesFromAutoStyle').and.callThrough();

      nodeDefinitionModel = layerDefinitionModel.getAnalysisDefinitionNodeModel();
      nodeDefinitionModel.set('simple_geom', 'point');

      category = this.widgetDefinitionsCollection.add({
        id: 'as1',
        type: 'category',
        title: 'category',
        layer_id: 'integration-test',
        options: {
          column: 'col'
        },
        source: {
          id: 'a0'
        }
      });
      category.trigger('sync', category);

      histogram = this.widgetDefinitionsCollection.add({
        id: 'as2',
        type: 'histogram',
        title: 'histogram',
        layer_id: 'integration-test',
        options: {
          column: 'col'
        },
        source: {
          id: 'a0'
        }
      });
      histogram.trigger('sync', histogram);
    });

    afterEach(function () {
      Backbone.ajax = originalAjax;
      category.trigger('destroy', category);
      histogram.trigger('destroy', category);
    });

    it('should cancel autostyle on remove widget', function () {
      var model = this.diDashboardHelpers.getWidget(category.id);
      spyOn(model, 'cancelAutoStyle');
      model.set({autoStyle: true});

      category.trigger('destroy', category);
      expect(model.cancelAutoStyle).toHaveBeenCalled();
    });

    it('should update layer definition model\'s autostyle properly', function () {
      var model = this.diDashboardHelpers.getWidget(category.id);
      model.set({autoStyle: true});
      expect(layerDefinitionModel.get('autoStyle')).toBe(model.id);
      expect(layerDefinitionModel.styleModel.setPropertiesFromAutoStyle).toHaveBeenCalled();

      model.set({autoStyle: false});
      expect(layerDefinitionModel.get('autoStyle')).toBe(false);
      expect(layerDefinitionModel.styleModel.resetPropertiesFromAutoStyle).toHaveBeenCalled();
    });

    it('should update layer definition model\'s previousCartoCSS only if not autoStyle applied', function () {
      layerDefinitionModel.attributes.cartocss = 'wadus';

      spyOn(layerDefinitionModel, 'set').and.callThrough();
      var categoryModel = this.diDashboardHelpers.getWidget(category.id);
      var histogramModel = this.diDashboardHelpers.getWidget(histogram.id);

      spyOn(categoryModel, 'getAutoStyle').and.returnValue({
        cartocss: '#dummy {}',
        definition: {
          point: {
            color: {
              range: {}
            }
          }
        }
      });

      spyOn(histogramModel, 'getAutoStyle').and.returnValue({
        cartocss: '#dummy {}',
        definition: {
          point: {
            color: {
              range: {}
            }
          }
        }
      });

      layerDefinitionModel.styleModel.setPropertiesFromAutoStyle = function () {};

      categoryModel.set({autoStyle: true});
      expect(layerDefinitionModel.get('autoStyle')).toBe(categoryModel.id);
      expect(layerDefinitionModel.get('cartocss')).toBe('#dummy {}');
      expect(layerDefinitionModel.set).toHaveBeenCalledWith(jasmine.objectContaining({
        previousCartoCSS: 'wadus'
      }));

      histogramModel.set({autoStyle: true});
      expect(layerDefinitionModel.get('autoStyle')).toBe(histogramModel.id);
      expect(categoryModel.get('autoStyle')).toBe(false);
      expect(layerDefinitionModel.set).not.toHaveBeenCalledWith(jasmine.objectContaining({
        previousCartoCSS: '#dummy {}'
      }));
    });

    it('should update layer definition model\'s style properly based on previous custom style', function () {
      var css = '#layer { marker-width: 5; marker-fill: red; marker-fill-opacity: 1; marker-line-width: 1; marker-line-color: #ff0e0e; marker-line-opacity: 1; }';
      var model = this.diDashboardHelpers.getWidget(category.id);

      model.set({ autoStyle: true });

      expect(layerDefinitionModel.get('cartocss_custom')).toBe(false);

      layerDefinitionModel.set({
        previousCartoCSSCustom: true,
        previousCartoCSS: css
      });

      model.set({ autoStyle: false });

      expect(layerDefinitionModel.get('cartocss_custom')).toBe(true);
      expect(layerDefinitionModel.get('cartocss')).toBe(css);
    });

    it('should update layer definition model\'s color properly', function () {
      var model = this.diDashboardHelpers.getWidget(category.id);
      model.set({autoStyle: true}, {silent: true});
      model.set({color: '#fabada'});
      expect(layerDefinitionModel.get('autoStyle')).toBe(model.id);
      expect(layerDefinitionModel.styleModel.setPropertiesFromAutoStyle).toHaveBeenCalled();

      layerDefinitionModel.styleModel.setPropertiesFromAutoStyle.calls.reset();

      model.set({autoStyle: false}, {silent: true});
      model.set({color: '#f4b4d4'});
      expect(layerDefinitionModel.get('autoStyle')).toBe(false);
      expect(layerDefinitionModel.styleModel.setPropertiesFromAutoStyle).not.toHaveBeenCalled();
    });

    it('should disable autoStyle if aggregation is not simple', function () {
      var model = this.diDashboardHelpers.getWidget(category.id);
      model.set({autoStyle: true});
      expect(layerDefinitionModel.get('autoStyle')).toBe(model.id);
      expect(layerDefinitionModel.styleModel.setPropertiesFromAutoStyle).toHaveBeenCalled();

      layerDefinitionModel.styleModel.set({type: 'squares'});
      layerDefinitionModel.save();

      expect(layerDefinitionModel.get('autoStyle')).toBe(false);
      expect(model.get('autoStyle')).toBe(false);
    });
  });

  describe('when the layer style has changed', function () {
    it("should disable any activated widgets' autoStyle", function () {
      this.a0 = this.analysisDefinitionNodesCollection.add({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foobar'
        }
      });

      var nodeMod = this.diDashboardHelpers.analyse(this.a0.toJSON());

      var layerDefinitionModel = this.layerDefinitionsCollection.add({
        id: 'integration-test',
        kind: 'carto',
        options: {
          table_name: 'something',
          source: 'a0',
          cartocss: '#layer {}'
        }
      });

      // We have to add the analysis and the layer manually due to in this class
      // there is no bindings for those purposes (layers-integration will have it)
      var visMap = this.diDashboardHelpers.visMap();
      var attrs = layerDefinitionModel.toJSON();
      attrs.source = nodeMod;
      attrs.cartocss = attrs.options.tile_style;
      visMap.createCartoDBLayer(attrs);

      var nodeDef = layerDefinitionModel.getAnalysisDefinitionNodeModel();
      nodeDef.queryGeometryModel.set('simple_geom', 'point');
      spyOn(layerDefinitionModel, 'save');

      var model = this.widgetDefinitionsCollection.add({
        id: 'w-100',
        type: 'category',
        title: 'test',
        layer_id: 'integration-test',
        options: {
          column: 'col'
        },
        source: {
          id: 'a0'
        }
      });
      model.trigger('sync', model);

      var widgetModel = this.diDashboardHelpers.getWidgets()[0];
      widgetModel.set('autoStyle', true);
      layerDefinitionModel.set('cartocss', 'differentCartocss');
      expect(widgetModel.get('autoStyle')).toBe(false);
    });
  });

  describe('time series', function () {
    var xhrSpy = jasmine.createSpyObj('xhr', ['abort', 'always', 'fail']);

    var cartocss = 'Map {-torque-frame-count: 256;-torque-animation-duration: 30;-torque-time-attribute: cartodb_id";-torque-aggregation-function: "count(1)";-torque-resolution: 4;-torque-data-aggregation: linear;} #layer {}, #layer[frame-offset=1] {marker-width: 9; marker-fill-opacity: 0.45;} #layer[frame-offset=2] {marker-width: 11; marker-fill-opacity: 0.225;}';

    var animatedChanged1 = {attribute: 'longitude', duration: 24, overlap: false, resolution: 4, steps: 256, trails: 2};
    var animatedChanged2 = {attribute: 'latitude', duration: 24, overlap: false, resolution: 4, steps: 256, trails: 3};

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

    it('should create only one time-series widget', function () {
      this.layerDefModel.styleModel.set({animated: animatedChanged1});
      this.layerDefModel.set({alias: 'wadus'});

      // Manually we launch the method
      this.integration.manageTimeSeriesForTorque(this.layerDefModel);

      Backbone.Model.prototype.sync.calls.argsFor(0)[2].error({
        error: 'abort'
      });

      this.layerDefModel.styleModel.set({animated: animatedChanged2});
      this.layerDefModel.set({alias: 'wadus wadus'});

      // Manually we launch the method
      this.integration.manageTimeSeriesForTorque(this.layerDefModel);

      Backbone.Model.prototype.sync.calls.argsFor(0)[2].success({
        id: '1',
        layer_id: 'wadus',
        options: {
          column: 'cartodb_id',
          bins: 256,
          animated: true,
          sync_on_bbox_change: true
        },
        order: 0,
        source: {
          id: 'a0'
        },
        style: {
          widget_style: {
            definition: {
              color: {
                fixed: '#F2CC8F',
                opacity: 1
              }
            }
          }
        },
        title: 'time_date__t',
        type: 'time-series'
      });

      expect(this.widgetDefinitionsCollection.length).toBe(1);
    });
  });

  describe('._initBinds', function () {
    it('should call _setSelectedWidget on _widgetDefinitionsCollection:setSelected', function () {
      this.widgetDefinitionsCollection.trigger('setSelected');

      expect(this.integration._setSelectedWidget).toHaveBeenCalled();
    });
  });

  describe('._setSelectedWidget', function () {
    it('should trigger setDisabled with the correct value', function () {
      setSelectedSpy.and.callThrough();

      var selectedModel = this.widgetDefinitionsCollection.add({
        id: 'w-100',
        type: 'category',
        title: 'test',
        layer_id: 'integration-test',
        options: {
          column: 'col'
        },
        source: {
          id: 'a0'
        }
      });

      var disabledModel = this.widgetDefinitionsCollection.add({
        id: 'w-200',
        type: 'category',
        title: 'test',
        layer_id: 'integration-test',
        options: {
          column: 'col'
        },
        source: {
          id: 'a0'
        }
      });

      spyOn(selectedModel, 'trigger');
      spyOn(disabledModel, 'trigger');
      spyOn(this.diDashboardHelpers, 'getWidgets').and.returnValue(this.widgetDefinitionsCollection);

      this.integration._setSelectedWidget(selectedModel.get('id'));

      expect(selectedModel.trigger).toHaveBeenCalledWith('setDisabled', selectedModel, selectedModel.get('id'));
      expect(disabledModel.trigger).toHaveBeenCalledWith('setDisabled', disabledModel, selectedModel.get('id'));
    });
  });
});
