var $ = require('jquery');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var WidgetsFormContentView = require('builder/editor/widgets/widgets-form/widgets-form-content-view');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');
var Router = require('builder/routes/router');
var FactoryModals = require('../../../factories/modals');

describe('editor/widgets/widgets-form/widgets-form-content-view', function () {
  beforeEach(function () {
    spyOn(Router, 'navigate');

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar',
      status: 'fetched'
    }, {
      configModel: configModel
    });
    querySchemaModel.columnsCollection.reset([
      { name: 'cartodb_id', type: 'number' },
      { name: 'created_at', type: 'date' }
    ]);

    var userModel = {
      featureEnabled: function () {
        return true;
      }
    };

    this.modals = FactoryModals.createModalService();

    var dfd = $.Deferred();
    dfd.resolve();
    spyOn(querySchemaModel, 'fetch').and.returnValue(dfd.promise());

    this.analysisDefinitionNodesCollection = new Backbone.Collection();
    var nodeDefModel = this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      table_name: 'test'
    });
    nodeDefModel.querySchemaModel = querySchemaModel;
    nodeDefModel.isSourceType = function () {
      return true;
    };

    this.layerDefinitionsCollection = new Backbone.Collection({
      id: 'l1',
      color: 'red',
      name: 'layerrr'
    });
    var layerDefinitionModel = this.layerDefinitionsCollection.at(0);
    layerDefinitionModel.getName = function () {
      return this.get('name');
    };
    layerDefinitionModel.getTableName = function () {
      return 'table name';
    };
    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return nodeDefModel;
    };
    layerDefinitionModel.findAnalysisDefinitionNodeModel = function () {
      return nodeDefModel;
    };

    this.widgetDefinitionModel = new WidgetDefinitionModel({
      id: 'w-456',
      title: 'some title',
      type: 'formula',
      layer_id: 'l1',
      source: 'a0',
      column: 'hello',
      operation: 'sum',
      prefix: 'my-prefix'
    }, {
      configModel: configModel,
      mapId: 'm-123'
    });

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep']);

    this.view = new WidgetsFormContentView({
      userActions: {},
      modals: this.modals,
      widgetDefinitionModel: this.widgetDefinitionModel,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      stackLayoutModel: this.stackLayoutModel,
      stackLayoutPrevStep: 0,
      userModel: userModel,
      configModel: configModel
    });
    this.view.render();
  });

  it('should generate the right tabs', function () {
    expect(this.view.$el.text()).toContain('editor.widgets.widgets-form.data.title');
    expect(this.view.$el.text()).toContain('editor.widgets.widgets-form.style.title');
  });

  it('should get back to the previous step if arrow is clicked', function () {
    spyOn(Router, 'goToPreviousRoute');

    this.view.$('.js-back').click();

    expect(Router.goToPreviousRoute).toHaveBeenCalledWith({
      fallback: 'widgets'
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
