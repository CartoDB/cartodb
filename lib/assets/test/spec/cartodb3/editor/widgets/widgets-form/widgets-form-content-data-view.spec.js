var $ = require('jquery');
var _ = require('underscore');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var WidgetsFormContentDataView = require('../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/widgets-form-content-data-view');
var WidgetDefinitionModel = require('../../../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/widgets/widgets-form/widgets-form-content-data-view', function () {
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
      operation: 'sum',
      prefix: 'my-prefix'
    }, {
      configModel: configModel,
      mapId: 'm-123'
    });

    this.view = new WidgetsFormContentDataView({
      widgetDefinitionModel: this.widgetDefinitionModel,
      querySchemaModel: querySchemaModel
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(2);
  });

  it('should save widget definition when widget type has changed', function () {
    spyOn(this.widgetDefinitionModel, 'save');
    spyOn(this.widgetDefinitionModel, 'changeType');
    this.view.$('.Carousel-item:eq(0) button').click(); // Changing it to category
    expect(this.widgetDefinitionModel.changeType).toHaveBeenCalledWith('category');
    expect(this.widgetDefinitionModel.save).toHaveBeenCalled();
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
