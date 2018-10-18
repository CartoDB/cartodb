var $ = require('jquery');
var Backbone = require('backbone');
var UserActions = require('builder/data/user-actions');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var EditorWidgetsView = require('builder/editor/widgets/widgets-view');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');
var Router = require('builder/routes/router');
var FactoryModals = require('../../factories/modals');

var STATES = {
  loading: 'loading',
  ready: 'ready'
};

describe('editor/widgets/widgets-view', function () {
  var analysisDefinitionNodeModel;

  function createLayerDefinitionsCollection (layerDefinitionModel) {
    var layerDefinitionsCollection = new Backbone.Collection([layerDefinitionModel]);

    layerDefinitionsCollection.loadAllQueryGeometryModels = function (callback) {
      callback();
    };

    layerDefinitionsCollection.isThereAnyGeometryData = function () {
      return Promise.resolve(true);
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
    it('should initialize a viewModel with a state', function () {
      expect(this.view.viewModel).toBeDefined();
      expect(this.view.viewModel.get('state')).toBeDefined();
    });

    describe('._initViewState', function () {
      it('should initialze a viewState that indicates if there is geometry data', function () {
        expect(this.view._viewState).toBeDefined();
        expect(this.view._viewState.get('anyGeometryData')).toBeDefined();
      });

      it('should call _setViewState', function () {
        spyOn(this.view, '_setViewState');

        this.view._initViewState();
        expect(this.view._setViewState).toHaveBeenCalled();
      });
    });
  });

  describe('._setViewState', function () {
    it('should update _viewState and set if there is geometry data', function (done) {
      this.view._viewState.set('anyGeometryData', false);
      spyOn(this.layerDefinitionsCollection, 'isThereAnyGeometryData').and.returnValue(Promise.resolve(true));

      this.view._setViewState();

      setTimeout(function () {
        expect(this.view._viewState.get('anyGeometryData')).toEqual(true);
        done();
      }.bind(this), 0);
    });
  });

  describe('render', function () {
    it('should render loading view if state is loading', function () {
      this.view.viewModel.set({state: STATES.loading});
      this.view.render();
      expect(this.view.$('.FormPlaceholder-widget').length).toBe(4);
    });

    it('should not render no geometry view when _anyGeometryData is true', function () {
      this.view.render();

      expect(this.view.$el.text()).not.toContain('editor.widgets.no-geometry-data');
    });

    it('should render no geometry view if no data when no geometry data', function () {
      this.view._viewState.set('anyGeometryData', false);
      this.view.render();

      expect(this.view.$el.text()).toContain('editor.widgets.no-geometry-data');
    });

    it('should render if widgets collection add one or more widgets', function () {
      spyOn(this.view, 'render');

      this.view._initBinds();
      this.widgetDefinitionsCollection.trigger('successAdd');

      expect(this.view.render).toHaveBeenCalled();
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
  });

  it('should have no leaks', function () {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });
});
