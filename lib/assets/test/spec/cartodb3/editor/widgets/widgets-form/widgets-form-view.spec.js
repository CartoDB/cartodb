var $ = require('jquery');
var _ = require('underscore');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var WidgetsFormView = require('../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/widgets-form-view');
var WidgetDefinitionModel = require('../../../../../../javascripts/cartodb3/data/widget-definition-model');
var UserActions = require('../../../../../../javascripts/cartodb3/data/user-actions');

describe('editor/widgets/widgets-form/widgets-form-view', function () {
  beforeEach(function () {
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

    var dfd = $.Deferred();
    dfd.resolve();
    spyOn(querySchemaModel, 'fetch').and.returnValue(dfd.promise());

    this.widgetDefinitionModel = new WidgetDefinitionModel({
      id: 'w-456',
      title: 'some title',
      type: 'formula',
      layer_id: 'l1',
      source: 'a0',
      column: 'hello',
      operation: 'sum'
    }, {
      configModel: configModel,
      mapId: 'm-123'
    });

    this.userActions = UserActions({
      userModel: {},
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    this.promise = $.Deferred();
    spyOn(this.userActions, 'saveWidget').and.returnValue(this.promise);

    this.view = new WidgetsFormView({
      userActions: this.userActions,
      widgetDefinitionModel: this.widgetDefinitionModel,
      querySchemaModel: querySchemaModel
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(2); // carousel and form fields
  });

  it('should update form model when widgetDefinitionModel rename', function () {
    this.widgetDefinitionModel.set({title: 'wadus'});
    expect(this.view._formView._widgetFormModel.get('title')).toBe('wadus');
  });

  it('should have enabler editor component for suffix and prefix, disable by default', function () {
    expect(this.view.$('input[name=prefix]').length).toBe(1);
    expect(this.view.$('input[name=suffix]').length).toBe(1);
    expect(this.view.$('input[name=prefix]').prop('readonly')).toBe(true);
    expect(this.view.$('input[name=suffix]').prop('readonly')).toBe(true);
  });

  it('should save widget definition when widget type has changed', function () {
    spyOn(this.widgetDefinitionModel, 'save');
    spyOn(this.widgetDefinitionModel, 'changeType');

    this.view.$('.Carousel-item:eq(0) button').click(); // Changing it to category
    expect(this.widgetDefinitionModel.changeType).toHaveBeenCalledWith('category');
    expect(this.userActions.saveWidget).toHaveBeenCalledWith(this.widgetDefinitionModel);
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
