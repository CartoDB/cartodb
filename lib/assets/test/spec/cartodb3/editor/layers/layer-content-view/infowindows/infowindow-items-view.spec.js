var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowItemsView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-items-view');
var InfowindowDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var _ = require('underscore');

describe('editor/layers/layer-content-view/infowindows/infowindow-items-view', function () {
  var view, model;

  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar'
    }, {
      configModel: this.configModel
    });

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
      layerInfowindowModel: model,
      layerDefinitionModel: this.layerDefinitionModel,
      hasValidTemplate: true
    });
  });

  it('should render items if is fetched', function () {
    view.render();
    expect(_.size(view._subviews)).toBe(0);
    view._querySchemaModel.set({
      'status': 'fetched'
    });
    expect(_.size(view._subviews)).toBe(1);
  });

  it('should not render items if has not valid template', function () {
    view._querySchemaModel.set({
      'status': 'fetched'
    });
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

