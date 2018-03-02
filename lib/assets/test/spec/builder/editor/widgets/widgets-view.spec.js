var $ = require('jquery');
var Backbone = require('backbone');
var UserActions = require('builder/data/user-actions');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var EditorWidgetsView = require('builder/editor/widgets/widgets-view');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');
var Router = require('builder/routes/router');
var FactoryModals = require('../../factories/modals');

describe('editor/widgets/widgets-view', function () {
  var analysisDefinitionNodeModel;
  var goToWidgetSpy;

  function createLayerDefinitionsCollection (layerDefinitionModel) {
    var resolveFn = null;
    var calls = [];
    var layerDefinitionsCollection = new Backbone.Collection([layerDefinitionModel]);

    layerDefinitionsCollection.loadAllQueryGeometryModels = function (callback) {
      callback();
    };

    layerDefinitionsCollection.isThereAnyGeometryData = function () {
      calls.push('isThereAnyGeometryData');
      return new Promise(function (resolve, reject) {
        resolveFn = resolve;
      });
    };

    layerDefinitionsCollection.resolveGeometryPromise = function (value) {
      if (resolveFn) {
        resolveFn(value);
      }
    };

    layerDefinitionsCollection.getCalls = function () {
      return calls;
    };

    return layerDefinitionsCollection;
  }

  beforeEach(function () {
    spyOn(Router, 'navigate');

    this.model = new LayerDefinitionModel({
      id: 'l-100',
      options: {
        type: 'CartoDB'
      }
    }, {
      parse: true,
      configModel: {}
    });

    analysisDefinitionNodeModel = new Backbone.Model({ type: 'source' });
    analysisDefinitionNodeModel.querySchemaModel = new Backbone.Model();
    analysisDefinitionNodeModel.querySchemaModel.hasGeometryData = function () {
      return true;
    };
    analysisDefinitionNodeModel.isSourceType = function () {
      return true;
    };
    analysisDefinitionNodeModel.getColor = function () {
      return '#fabada';
    };
    this.model.findAnalysisDefinitionNodeModel = function () {
      return analysisDefinitionNodeModel;
    };

    spyOn(this.model, 'getAnalysisDefinitionNodeModel').and.returnValue(analysisDefinitionNodeModel);

    this.widgetDefinitionsCollection = new Backbone.Collection();
    this.analysisDefinitionNodesCollection = new Backbone.Collection();
    this.layerDefinitionsCollection = createLayerDefinitionsCollection(this.model);

    this.userActions = UserActions({
      userModel: {},
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    this.promise = $.Deferred();
    spyOn(this.userActions, 'saveWidget').and.returnValue(this.promise);

    goToWidgetSpy = spyOn(EditorWidgetsView.prototype, '_goToWidget');

    this.view = new EditorWidgetsView({
      modals: FactoryModals.createModalService(),
      userActions: this.userActions,
      userModel: {},
      configModel: {},
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      stackLayoutModel: jasmine.createSpyObj('stackLayoutModel', ['nextStep'])
    });
    this.view.render();
  });

  describe('_initialize', function () {
    it('this._anyGeometryData starts in true', function () {
      expect(this.view._anyGeometryData).toBe(true);
    });

    it('this._renderIfAnyGeometryDataChanges has been called', function () {
      expect(this.layerDefinitionsCollection.getCalls()).toContain('isThereAnyGeometryData');
    });
  });

  describe('render', function () {
    it('should render loading view if state is loading', function () {
      this.view.viewModel.set({state: 'loading'});
      this.view.render();
      expect(this.view.$('.FormPlaceholder-widget').length).toBe(4);
    });

    it('should not render no geometry view when _anyGeometryData is true', function () {
      this.view.render();

      expect(this.view.$el.text()).not.toContain('editor.widgets.no-geometry-data');
    });

    it('should render no geometry view if no data when no geometry data', function () {
      this.view._anyGeometryData = false;
      this.view.render();

      expect(this.view.$el.text()).toContain('editor.widgets.no-geometry-data');
    });
  });

  describe('_renderIfAnyGeometryDataChanges', function () {
    it('should call to render if anyGeometryData changes', function (done) {
      var self = this;
      spyOn(this.view, 'render');

      this.layerDefinitionsCollection.resolveGeometryPromise(!this.view._anyGeometryData);

      setTimeout(function () {
        expect(self.view.render).toHaveBeenCalled();
        done();
      }, 0); // Promises are always resolved in the next tick
    });

    it('should not call to render if anyGeometryData do not change', function (done) {
      var self = this;
      spyOn(this.view, 'render');

      this.layerDefinitionsCollection.resolveGeometryPromise(this.view._anyGeometryData);

      setTimeout(function () {
        expect(self.view.render).not.toHaveBeenCalled();
        done();
      }, 0); // Promises are always resolved in the next tick
    });
  });

  describe('sortable', function () {
    beforeEach(function () {
      this.widgetDefModel1 = new WidgetDefinitionModel({
        id: 'widget-1',
        type: 'formula',
        title: 'formula example',
        layer_id: 'l-100',
        column: 'areas',
        operation: 'avg',
        order: 1
      }, {
        configModel: {},
        mapId: 'm-123'
      });
      this.widgetDefModel2 = new WidgetDefinitionModel({
        id: 'widget-2',
        type: 'histogram',
        title: 'histogram example',
        layer_id: 'l-100',
        column: 'population',
        order: 0
      }, {
        configModel: {},
        mapId: 'm-123'
      });
      this.widgetDefinitionsCollection.add(this.widgetDefModel1);
      this.widgetDefinitionsCollection.add(this.widgetDefModel2);
    });

    it('should be initialized when view is rendered', function () {
      spyOn(this.view, '_initSortable').and.callThrough();
      this.view.render();
      expect(this.view._initSortable).toHaveBeenCalled();
      expect(this.view.$('.js-widgets').data('ui-sortable')).not.toBeUndefined();
    });

    it('should be show the widgets in the right order', function () {
      this.view.render();
      expect(this.view.$('.js-widgets li:nth-child(1) .js-title').text()).toBe('histogram example');
      expect(this.view.$('.js-widgets li:nth-child(2) .js-title').text()).toBe('formula example');
    });

    it('should update the order of the models when sort has finished', function () {
      this.view.render();
      expect(this.widgetDefModel2.get('order')).toBe(0);
      expect(this.widgetDefModel1.get('order')).toBe(1);

      // Impossible to fake sortable behaviour so...
      this.view.$('.js-widgetItem:eq(1)').insertBefore(this.view.$('.js-widgetItem:eq(0)'));
      this.view._onSortableFinish();

      // End of fake sortable
      expect(this.widgetDefModel1.get('order')).toBe(0);
      expect(this.widgetDefModel2.get('order')).toBe(1);
      expect(this.userActions.saveWidget).toHaveBeenCalled();
    });
  });

  describe('when adding a widget definition', function () {
    var widgetDefModel;

    beforeEach(function () {
      widgetDefModel = new WidgetDefinitionModel({
        id: 'widget-3',
        type: 'formula',
        title: 'AVG districts homes',
        layer_id: 'l-100',
        column: 'areas',
        operation: 'avg'
      }, {
        configModel: {},
        mapId: 'm-123'
      });
      this.widgetDefinitionsCollection.add(widgetDefModel);
    });

    it('should go to the widget view', function () {
      expect(this.view._goToWidget).toHaveBeenCalled();
      expect(this.view._goToWidget.calls.mostRecent().args[0].get('id')).toEqual('widget-3');
    });
  });

  describe('._goToWidget', function () {
    it('should go to the widget view', function () {
      goToWidgetSpy.and.callThrough();
      spyOn(Router, 'goToWidget');

      var widgetDefModel = new WidgetDefinitionModel({
        id: 'widget-3',
        type: 'formula',
        title: 'AVG districts homes',
        layer_id: 'l-100',
        column: 'areas',
        operation: 'avg'
      }, {
        configModel: {},
        mapId: 'm-123'
      });

      this.view._goToWidget(widgetDefModel);

      expect(Router.goToWidget).toHaveBeenCalledWith(widgetDefModel.get('id'));
    });
  });

  it('should have no leaks', function () {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });
});
