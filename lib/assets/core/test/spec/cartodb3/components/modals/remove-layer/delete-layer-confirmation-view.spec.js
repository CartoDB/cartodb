var Backbone = require('backbone');
var _ = require('underscore');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var DeleteLayerConfirmationView = require('../../../../../../javascripts/cartodb3/components/modals/remove-layer/delete-layer-confirmation-view');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var ModalsServiceModel = require('../../../../../../javascripts/cartodb3/components/modals/modals-service-model');
var UserActions = require('../../../../../../javascripts/cartodb3/data/user-actions');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var VisDefinitionModel = require('../../../../../../javascripts/cartodb3/data/vis-definition-model');
var WidgetDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/widget-definitions-collection');

describe('modals/delete-layer-confirmation-view', function () {
  var view;

  var modalModel = new Backbone.Model();
  var visDefinitionModel = new Backbone.Model();

  var userData = {
    id: '8c253a9a-94d8-4042-883c-3aa81285e5e6',
    username: 'cdb',
    organization: {
      display_name: 'Globex Corporation',
      name: 'globex',
      avatar_url: 'https://s3.amazonaws.com/com.cartodb.users-assets.staging/development/cdb/assets/20161028125910fake-company-logo.jpg',
      user_count: 25
    }
  };

  var configData = {
    base_url: '/u/manolo',
    maps_api_template: 'http://{user}.localhost.lan:8181'
  };

  var configModel = new ConfigModel(configData);

  var userModel = new UserModel(userData, { configModel: configModel });

  var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
    configModel: configModel,
    userModel: userModel
  });

  var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
    configModel: configModel,
    userModel: userModel,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    mapId: 'map-123',
    stateDefinitionModel: {}
  });

  var widgetDefinitionsCollection = new WidgetDefinitionsCollection(null, {
    configModel: configModel,
    layerDefinitionsCollection: layerDefinitionsCollection,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    mapId: 'map-123'
  });

  var analysisDefinitionsCollection = new AnalysisDefinitionsCollection(null, {
    configModel: configModel,
    vizId: 'viz-123',
    layerDefinitionsCollection: layerDefinitionsCollection,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection
  });

  var userActions = new UserActions({
    userModel: userModel,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    analysisDefinitionsCollection: analysisDefinitionsCollection,
    layerDefinitionsCollection: layerDefinitionsCollection,
    widgetDefinitionsCollection: widgetDefinitionsCollection
  });

  var modals = new ModalsServiceModel();

  var layerModel = new LayerDefinitionModel({
    id: 'abc-123',
    kind: 'carto',
    options: {
      type: 'CartoDB',
      color: '#FABADA',
      table_name: 'foo_bar',
      name: 'foo',
      table_name_alias: 'foo_foo_bar',
      query: 'SELECT * FROM foo',
      tile_style: 'asdasd',
      visible: true
    }
  }, {
    configModel: configModel,
    parse: true
  });

  function createView (options) {
    return new DeleteLayerConfirmationView({
      userActions: {},
      modals: modals,
      layerModel: layerModel,
      modalModel: modalModel,
      visDefinitionModel: {},
      widgetDefinitionsCollection: widgetDefinitionsCollection
    });
  }

  describe('render', function () {
    it('should render properly', function () {
      view = createView();
      view.render();

      expect(view.$('h2')[0].textContent.trim()).toEqual('editor.layers.delete.title' + ' ' + layerModel.options.table_name_alias);
      expect(view.$('button.js-cancel > span')[0].textContent.trim()).toEqual('editor.layers.delete.cancel');
      expect(view.$('button.js-confirm > span')[0].textContent.trim()).toEqual('editor.layers.delete.confirm');
    });
  });
});
