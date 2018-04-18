var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AddWidgetsView = require('builder/components/modals/add-widgets/add-widgets-view');

describe('components/modals/add-widgets/add-widgets-view', function () {
  var LOADING_TITLE = 'loading-';
  var view;
  var configModel;
  var userModel;
  var analysisDefinitionNodesCollection;
  var layerDefinitionsCollection;
  var querySchemaModel0;
  var querySchemaModel1;
  var querySchemaModel2;
  var modalModel;

  function createViewFn (options) {
    var defaultOptions;

    configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    userModel = new UserModel({}, {
      configModel: configModel
    });

    analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      query: 'SELECT * FROM table_name'
    });

    analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'buffer',
      radio: 300,
      source: 'a0'
    });

    analysisDefinitionNodesCollection.add({
      id: 'a2',
      type: 'buffer',
      radio: 300,
      source: 'a1'
    });

    querySchemaModel0 = analysisDefinitionNodesCollection.at(0).querySchemaModel;
    querySchemaModel1 = analysisDefinitionNodesCollection.at(1).querySchemaModel;
    querySchemaModel2 = analysisDefinitionNodesCollection.at(2).querySchemaModel;

    querySchemaModel0.set({ status: 'fetched', query: 'SELECT * FROM table_name' });
    querySchemaModel1.set({ status: 'unavailable' });
    querySchemaModel2.set({ query: 'SELECT * FROM test' });
    querySchemaModel2.set({ status: 'fetching' });

    spyOn(querySchemaModel0, 'fetch');
    spyOn(querySchemaModel1, 'fetch');
    spyOn(querySchemaModel2, 'fetch');

    modalModel = new Backbone.Model();

    defaultOptions = {
      modalModel: modalModel,
      userActions: {
        saveWidgetOption: function (widgetOptionModels) {
          return Promise.resolve(widgetOptionModels);
        },
        updateWidgetsOrder: function (widgetOptionModels) {
          return Promise.resolve(widgetOptionModels);
        },
        goToEditWidget: function () {}
      },
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      layerDefinitionsCollection: layerDefinitionsCollection,
      widgetDefinitionsCollection: new Backbone.Collection()
    };

    return new AddWidgetsView(_.extend(defaultOptions, options));
  }

  beforeEach(function () {
    view = createViewFn();

    view.render();
  });

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  it('should show loading msg until all are fetched', function () {
    expect(view.$('.js-body').html()).toContain(LOADING_TITLE);
  });

  describe('when all layer tables are fetched', function () {
    beforeEach(function () {
      querySchemaModel2.set('status', 'fetched');
    });

    it('should render the content view', function () {
      expect(view.$('.js-body').html()).not.toContain(LOADING_TITLE);
    });
  });

  describe('when the user clicks on continue', function () {
    beforeEach(function () {
      spyOn(view, '_hasFetchedAllQuerySchemas').and.returnValue(true);
      view.render();
    });

    it('should call _saveSelectedWidgets if there are selected widgets', function () {
      var saveSelectedWidgetsSpy = spyOn(view, '_saveSelectedWidgets').and.callThrough();

      view._optionsCollection.add(new Backbone.Model({
        id: '1',
        selected: true
      }));

      view._onContinue();

      expect(saveSelectedWidgetsSpy).toHaveBeenCalled();
    });

    it('should not call _saveSelectedWidgets if there are not selected widgets', function () {
      var saveSelectedWidgetsSpy = spyOn(view, '_saveSelectedWidgets').and.returnValue(true);

      view._optionsCollection.add(new Backbone.Model({
        id: '2',
        selected: false
      }));

      view._onContinue();

      expect(saveSelectedWidgetsSpy).not.toHaveBeenCalled();
    });

    it('should call user actions to update widgets if the _saveSelectedWidgets succeeds', function (done) {
      spyOn(view, '_saveSelectedWidgets').and.returnValue(Promise.resolve());
      spyOn(view._userActions, 'updateWidgetsOrder');
      spyOn(view._userActions, 'goToEditWidget');

      view._optionsCollection.add(new Backbone.Model({
        id: '1',
        selected: true
      }));

      view._onContinue();

      setTimeout(function () {
        expect(view._userActions.updateWidgetsOrder).toHaveBeenCalled();
        expect(view._userActions.goToEditWidget).toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should call user actions to update widgets if the _saveSelectedWidgets fails', function (done) {
      spyOn(view, '_saveSelectedWidgets').and.returnValue(Promise.reject());
      spyOn(view._userActions, 'updateWidgetsOrder');
      spyOn(view._userActions, 'goToEditWidget');

      view._optionsCollection.add(new Backbone.Model({
        id: '1',
        selected: true
      }));

      view._onContinue();

      setTimeout(function () {
        expect(view._userActions.updateWidgetsOrder).toHaveBeenCalled();
        expect(view._userActions.goToEditWidget).not.toHaveBeenCalled();
        done();
      }, 0);
    });
  });

  describe('when the selected widgets are selected to be saved', function () {
    it('should call saveWidgetOption for each selectedOptionModel', function () {
      var saveWidgetOptionSpy = spyOn(view._userActions, 'saveWidgetOption').and.callThrough();

      var widgetModel_1 = new Backbone.Model({
        id: '1',
        selected: true
      });

      var widgetModel_2 = new Backbone.Model({
        id: '2',
        selected: true
      });

      view._saveSelectedWidgets([widgetModel_1, widgetModel_2]);

      expect(saveWidgetOptionSpy).toHaveBeenCalledWith(widgetModel_1);
      expect(saveWidgetOptionSpy).toHaveBeenCalledWith(widgetModel_2);
    });

    it('should return an async response that succeeds if all the widgets can be saved', function (done) {
      var widgetModel_1 = new Backbone.Model({
        id: '1',
        selected: false
      });

      var widgetModel_2 = new Backbone.Model({
        id: '2',
        selected: true
      });

      view._saveSelectedWidgets([widgetModel_1, widgetModel_2])
        .then(function (response) {
          expect(response.length).toEqual(2);
          done();
        });
    });

    it('should return an async response that fails if one of the widgets can not be saved', function (done) {
      var errorResponse = 'Error';

      view = createViewFn({userActions: {
        saveWidgetOption: function () {
          return Promise.reject(errorResponse);
        },
        updateWidgetsOrder: function () {
          return Promise.resolve({});
        },
        goToEditWidget: function () {}
      }});

      view.render();

      var widgetModel_1 = new Backbone.Model({
        id: '1',
        selected: false
      });

      var widgetModel_2 = new Backbone.Model({
        id: '2',
        selected: true
      });

      view._saveSelectedWidgets([widgetModel_1, widgetModel_2])
        .catch(function (response) {
          expect(response).toEqual(errorResponse);
          done();
        });
    });
  });
});
