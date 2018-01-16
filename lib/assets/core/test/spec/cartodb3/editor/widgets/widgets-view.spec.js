var $ = require('jquery');
var Backbone = require('backbone');
var UserActions = require('../../../../../javascripts/cartodb3/data/user-actions');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var EditorWidgetsView = require('../../../../../javascripts/cartodb3/editor/widgets/widgets-view');
var WidgetDefinitionModel = require('../../../../../javascripts/cartodb3/data/widget-definition-model');
var Router = require('../../../../../javascripts/cartodb3/routes/router');
var FactoryModals = require('../../factories/modals');

describe('editor/widgets/widgets-view', function () {
  var analysisDefinitionNodeModel;
  var goToWidgetSpy;

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
    this.layerDefinitionsCollection = new Backbone.Collection([this.model]);

    this.layerDefinitionsCollection.loadAllQueryGeometryModels = function (callback) {
      callback();
    };

    this.layerDefinitionsCollection.isThereAnyGeometryData = function () {
      return this.some(function (layerDefModel) {
        var querySchemaModel = layerDefModel.getAnalysisDefinitionNodeModel().querySchemaModel;
        return querySchemaModel.hasGeometryData();
      });
    };

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

  describe('loading', function () {
    it('should render loading view', function () {
      this.view.viewModel.set({state: 'loading'});
      this.view.render();
      expect(this.view.$('.FormPlaceholder-widget').length).toBe(4);
    });
  });

  describe('when querySchemaModel is not fetched', function () {
    it('should not render no geometry view', function () {
      analysisDefinitionNodeModel.querySchemaModel.set({status: 'unfetched'});
      this.view.render();

      expect(this.view.$el.text()).not.toContain('editor.widgets.no-geometry-data');
    });
  });

  describe('when no geometry data', function () {
    it('should render no geometry view if no data', function () {
      analysisDefinitionNodeModel.querySchemaModel.hasGeometryData = function () {
        return false;
      };
      this.view.render();

      expect(this.view.$el.text()).toContain('editor.widgets.no-geometry-data');
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
