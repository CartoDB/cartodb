var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var DeleteLayerConfirmationView = require('../../../../../../javascripts/cartodb3/components/modals/remove-layer/delete-layer-confirmation-view');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var ModalsServiceModel = require('../../../../../../javascripts/cartodb3/components/modals/modals-service-model');
var UserActions = require('../../../../../../javascripts/cartodb3/data/user-actions');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var VisDefinitionModel = require('../../../../../../javascripts/cartodb3/data/vis-definition-model');
var WidgetDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/widget-definitions-collection');

describe('modals/delete-layer-confirmation-view', function () {
  var view;
  var modalModel;
  var userData;
  var configData;
  var configModel;
  var userModel;
  var analysisDefinitionNodesCollection;
  var layerModel;
  var layerDefinitionsCollection;
  var visDefinitionModel;
  var widgetDefinitionsCollection;
  var analysisDefinitionsCollection;
  var userActions;
  var modals;

  modalModel = new Backbone.Model();

  userData = {
    id: '8c253a9a-94d8-4042-883c-3aa81285e5e6',
    username: 'cdb'
  };

  configData = {
    base_url: '/u/manolo',
    maps_api_template: 'http://{user}.localhost.lan:8181'
  };

  configModel = new ConfigModel(configData);

  userModel = new UserModel(userData, { configModel: configModel });

  analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection([], {
    configModel: configModel,
    userModel: userModel
  });

  layerModel = new LayerDefinitionModel({
    id: 'map-123',
    kind: 'carto',
    options: {
      type: 'CartoDB',
      color: '#FABADA',
      table_name: 'foo_bar',
      name: 'foo',
      letter: 'a',
      source: 'map-123',
      table_name_alias: 'foo_foo_bar',
      query: 'SELECT * FROM foo',
      tile_style: 'asdasd',
      visible: true
    }
  }, {
    configModel: configModel,
    parse: true
  });

  layerDefinitionsCollection = new LayerDefinitionsCollection([layerModel], {
    configModel: configModel,
    userModel: userModel,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    mapId: 'map-123',
    stateDefinitionModel: {}
  });

  visDefinitionModel = new VisDefinitionModel({
    name: 'foo',
    privacy: 'LINK',
    updated_at: '2016-06-21T15:30:06+00:00',
    type: 'derived',
    tags: ['foo', 'bar'],
    permission: {}
  }, {
    configModel: configModel
  });

  widgetDefinitionsCollection = new WidgetDefinitionsCollection([layerModel], {
    configModel: configModel,
    layerDefinitionsCollection: layerDefinitionsCollection,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    mapId: 'map-123'
  });

  analysisDefinitionsCollection = new AnalysisDefinitionsCollection([layerModel], {
    configModel: configModel,
    vizId: 'viz-123',
    layerDefinitionsCollection: layerDefinitionsCollection,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection
  });

  userActions = new UserActions({
    userModel: userModel,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    analysisDefinitionsCollection: analysisDefinitionsCollection,
    layerDefinitionsCollection: layerDefinitionsCollection,
    widgetDefinitionsCollection: widgetDefinitionsCollection
  });

  modals = new ModalsServiceModel();

  function createViewFn (options) {
    var defaultOptions = {
      userActions: userActions,
      modals: modals,
      layerModel: layerModel,
      modalModel: modalModel,
      visDefinitionModel: visDefinitionModel,
      widgetDefinitionsCollection: widgetDefinitionsCollection
    };

    return new DeleteLayerConfirmationView(_.extend(defaultOptions, options));
  }

  describe('render', function () {
    it('should render properly', function () {
      view = createViewFn();
      view.render();

      expect(view.$('h2')[0].textContent.trim()).toEqual('editor.layers.delete.title');
      expect(view.$('p')[0].textContent.trim()).toEqual('editor.layers.delete.desc');

      expect(view.$('li').length).toEqual(3);
      expect(view.$('li')[0].textContent.trim()).toEqual('editor.layers.delete.link-to-export');

      expect(view.$('button.js-cancel > span')[0].textContent.trim()).toEqual('editor.layers.delete.cancel');
      expect(view.$('button.js-confirm > span')[0].textContent.trim()).toEqual('editor.layers.delete.confirm');
    });

    it('should show the name of the layer to be deleted', function () {
      spyOn(layerModel, 'getName').and.callThrough();

      view = createViewFn();
      view.render();

      expect(layerModel.getName).toHaveBeenCalled();
    });
  });
});
