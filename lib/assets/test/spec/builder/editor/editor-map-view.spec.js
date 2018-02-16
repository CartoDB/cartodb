var _ = require('underscore');
var Backbone = require('backbone');
var UserModel = require('builder/data/user-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var ModalsService = require('builder/components/modals/modals-service-model');
var OnboardingsServiceModel = require('builder/components/onboardings/onboardings-service-model');
var EditorMapView = require('builder/editor/editor-map-view');
var EditorModel = require('builder/data/editor-model');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var Notifier = require('builder/components/notifier/notifier');
var AppNotifications = require('builder/app-notifications');
var ConfigModel = require('builder/data/config-model');
var PrivacyCollection = require('builder/components/modals/publish/privacy-collection');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var MapModeModel = require('builder/map-mode-model');
var AnalysesService = require('builder/editor/layers/layer-content-views/analyses/analyses-service');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var Router = require('builder/routes/router');

describe('editor/editor-map-view', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
      .andReturn({ status: 200 });

    spyOn(Router, 'navigate');

    var configModel = new ConfigModel({
      sql_api_template: 'http://{user}.localhost.lan:8080',
      user_name: 'pepito'
    });

    var userModel = new UserModel({
      limits: {
        max_layers: 8
      },
      actions: {
        private_maps: true,
        private_tables: true
      }
    }, {
      configModel: configModel
    });

    var privacyCollection = new PrivacyCollection([{
      privacy: 'PUBLIC',
      title: 'Public',
      desc: 'Lorem ipsum',
      cssClass: 'is-green',
      selected: true
    }, {
      privacy: 'LINK',
      title: 'Link',
      desc: 'Yabadababa',
      cssClass: 'is-orange'
    }, {
      privacy: 'PASSWORD',
      title: 'Password',
      desc: 'Wadus'
    }, {
      privacy: 'PRIVATE',
      title: 'Private',
      desc: 'Funínculo',
      cssClass: 'is-red'
    }]);

    var basemapLayerDefModel = new LayerDefinitionModel({
      type: 'Tiled',
      name: 'Basemap is always first',
      urlTemplate: 'http://{s}.example.com/{z}/{x}/{y}.png'
    }, {
      configModel: configModel
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      table_name: 'foobar'
    }, {
      configModel: configModel
    });

    this.layerDefinitionModel.styleModel = {
      isAnimation: function () {
        return false;
      }
    };

    this.nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'a2',
      type: 'buffer',
      params: {}
    }, {
      configModel: configModel,
      userModel: {}
    });

    spyOn(this.layerDefinitionModel, 'getNumberOfAnalyses').and.returnValue(3);
    spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.nodeDefModel);

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: {}
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([
      this.layerDefinitionModel,
      basemapLayerDefModel
    ], {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'My super fun vis',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: configModel
    });

    var editorModel = new EditorModel();

    this.modals = new ModalsService();
    this.onboardings = new OnboardingsServiceModel();

    var mapcapsCollection = new Backbone.Collection([{
      created_at: '2016-06-21T15:30:06+00:00'
    }]);
    var widgetDefinitionsCollection = new Backbone.Collection();
    widgetDefinitionsCollection.add({ id: 'widget-id' });
    widgetDefinitionsCollection.widgetsOwnedByLayer = function () { return 0; };

    this.mapModeModel = new MapModeModel();

    this.view = new EditorMapView({
      mapDefinitionModel: new Backbone.Model(),
      visDefinitionModel: visDefinitionModel,
      privacyCollection: privacyCollection,
      mapcapsCollection: mapcapsCollection,
      modals: this.modals,
      onboardings: this.onboardings,
      basemaps: {},
      userActions: {},
      analysis: {},
      vis: {},
      configModel: configModel,
      userModel: userModel,
      editorModel: editorModel,
      pollingModel: new Backbone.Model(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      legendDefinitionsCollection: new Backbone.Collection(),
      mapModeModel: this.mapModeModel,
      stateDefinitionModel: new Backbone.Model(),
      onboardingNotification: {},
      settingsCollection: new Backbone.Collection(),
      routeModel: new Backbone.Model({ currentRoute: '' })
    });

    Notifier.init({
      editorModel: editorModel
    });
    AppNotifications.init();

    this.view.render();
  });

  afterEach(function () {
    Notifier.off();
    AppNotifications.off();
    jasmine.Ajax.uninstall();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have two subview', function () {
    // Notifier is new subview
    expect(_.size(this.view._subviews)).toBe(2);
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('My super fun vis');
    expect(this.view.$el.text()).toContain('editor.tab-pane.layers.title-label');
    expect(this.view.$el.text()).toContain('editor.tab-pane.widgets.title-label');
  });

  describe('._onAddAnalysisClicked', function () {
    it('should add Analysis', function () {
      spyOn(AnalysesService, 'addAnalysis');

      this.view._onAddAnalysisClicked();

      expect(AnalysesService.addAnalysis).toHaveBeenCalled();
    });
  });

  describe('mapModeModel changes', function () {
    beforeEach(function () {
      var layerDefModel = this.layerDefinitionModel;
      spyOn(this.view._stackLayoutView.model, 'goBack');
      spyOn(this.view._stackLayoutView.model, 'goToStep');
      spyOn(this.mapModeModel, 'getFeatureDefinition').and.callFake(function () {
        return {
          getLayerDefinition: function () {
            return layerDefModel;
          },

          isNew: function () {
            return true;
          }
        };
      });
    });
  });

  describe('.handleRoute', function () {
    it('should call ._handleRoute', function () {
      spyOn(this.view, '_handleRoute');

      this.view.handleRoute();

      expect(this.view._handleRoute).toHaveBeenCalled();
    });
  });

  describe('._handleRoute', function () {
    beforeEach(function () {
      spyOn(this.view._stackLayoutView.model, 'goToStep');
    });

    describe('should switch to the correct stacklayout step', function () {
      // Jasmine breaks printing layerDefinitionModel, so extract the layer id from the call list
      function extractLayerTabArgs (spy) {
        var lastCall = spy.calls.mostRecent();
        return lastCall.args.map(function (arg) {
          if (arg && arg.id !== undefined) {
            return arg.id;
          }

          return arg;
        });
      }

      function generateTabSpec (tabNameRoute, tabNameStack) {
        return function () {
          var routeModel = new Backbone.Model({
            currentRoute: [tabNameRoute, 'l-1']
          });

          this.view._handleRoute(routeModel);

          var expected = extractLayerTabArgs(this.view._stackLayoutView.model.goToStep);
          expect(expected).toEqual([1, 'l-1', 'layer-content', tabNameStack]);
        };
      }

      it('for basemap', function () {
        var routeModel = new Backbone.Model({
          currentRoute: ['basemap']
        });

        this.view._handleRoute(routeModel);
        expect(this.view._stackLayoutView.model.goToStep).toHaveBeenCalledWith(1, null, 'basemaps');
      });

      it('for layers', function () {
        var routeModel = new Backbone.Model({
          currentRoute: ['layers']
        });

        this.view._handleRoute(routeModel);
        expect(this.view._stackLayoutView.model.goToStep).toHaveBeenCalledWith(0, 'layers');
      });

      it('for widget when not found', function () {
        spyOn(Router, 'goToLayerList');

        var routeModel = new Backbone.Model({
          currentRoute: ['layer_', 'invalid-layer-id']
        });

        this.view._handleRoute(routeModel);

        expect(Router.goToLayerList).toHaveBeenCalled();
      });

      it('for widgets', function () {
        var routeModel = new Backbone.Model({
          currentRoute: ['widgets']
        });

        this.view._handleRoute(routeModel);

        expect(this.view._stackLayoutView.model.goToStep).toHaveBeenCalledWith(0, 'widgets');
      });

      it('for widget', function () {
        var routeModel = new Backbone.Model({
          currentRoute: ['widget', 'widget-id']
        });

        this.view._handleRoute(routeModel);

        var expected = extractLayerTabArgs(this.view._stackLayoutView.model.goToStep);
        expect(expected).toEqual([1, 'widget-id', 'widget-content']);
      });

      it('for widget when not found', function () {
        spyOn(Router, 'goToWidgetList');

        var routeModel = new Backbone.Model({
          currentRoute: ['widget', 'invalid-widget-id']
        });

        this.view._handleRoute(routeModel);

        expect(Router.goToWidgetList).toHaveBeenCalled();
      });

      it('for feature edition', function () {
        this.mapModeModel._featureDefinition = {
          isNew: function () { return true; }
        };

        var routeModel = new Backbone.Model({
          currentRoute: ['edit_feature', 'l-1']
        });

        this.view._handleRoute(routeModel);

        var lastCallArgs = extractLayerTabArgs(this.view._stackLayoutView.model.goToStep);
        expect(lastCallArgs).toEqual([2, 'l-1', false]);
      });

      it('for layer data tab', generateTabSpec('layer_data', 'data'));
      it('for layer style tab', generateTabSpec('layer_style', 'style'));
      it('for layer legend tab', generateTabSpec('layer_legends', 'legends'));
      it('for layer legend tab', generateTabSpec('layer_popups', 'popups'));

      describe('for layer analyses tab', function () {
        it('without analysis id', function () {
          var routeModel = new Backbone.Model({
            currentRoute: ['layer_analyses', 'l-1']
          });

          this.view._handleRoute(routeModel);

          var expected = extractLayerTabArgs(this.view._stackLayoutView.model.goToStep);
          expect(expected).toEqual([1, 'l-1', 'layer-content', 'analyses', undefined]);
        });

        it('with analysis id', function () {
          var routeModel = new Backbone.Model({
            currentRoute: ['layer_analyses', 'l-1', 'c1']
          });

          this.view._handleRoute(routeModel);

          var expected = extractLayerTabArgs(this.view._stackLayoutView.model.goToStep);
          expect(expected).toEqual([1, 'l-1', 'layer-content', 'analyses', 'c1']);
        });
      });
    });
  });
});
