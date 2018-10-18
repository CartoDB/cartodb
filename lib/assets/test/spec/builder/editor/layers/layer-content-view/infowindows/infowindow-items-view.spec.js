var ConfigModel = require('builder/data/config-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var InfowindowItemsView = require('builder/editor/layers/layer-content-views/infowindow/infowindow-items-view');
var InfowindowDefinitionModel = require('builder/data/infowindow-definition-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var _ = require('underscore');

describe('editor/layers/layer-content-view/infowindows/infowindow-items-view', function () {
  var view, model;

  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar',
      status: 'fetched'
    }, {
      configModel: this.configModel
    });

    spyOn(this.querySchemaModel, 'fetch').and.callThrough();

    this.querySchemaModel.columnsCollection.reset([
      { name: 'name1', type: 'string', position: 0 },
      { name: 'name2', type: 'number', position: 1 },
      { name: 'name3', type: 'number', position: 2 }
    ]);

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      fetched: true,
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      },
      infowindow: {}
    }, {
      parse: true,
      configModel: this.configModel
    });

    model = new InfowindowDefinitionModel({}, {
      configModel: this.configModel
    });

    view = new InfowindowItemsView({
      querySchemaModel: this.querySchemaModel,
      model: model,
      layerDefinitionModel: this.layerDefinitionModel,
      hasValidTemplate: true
    });
  });

  it('should not render items if has not valid template', function () {
    view.render();
    expect(_.size(view._subviews)).toBe(1);
    view._hasValidTemplate = false;
    view.render();
    expect(_.size(view._subviews)).toBe(0);
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
