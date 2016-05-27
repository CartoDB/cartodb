var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var InfowindowContentView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-content-view');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var _ = require('underscore');

describe('editor/layers/layer-content-view/infowindow/infowindow-view', function () {
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

    view = new InfowindowContentView({
      configModel: this.configModel,
      querySchemaModel: this.querySchemaModel,
      model: model,
      layerDefinitionModel: this.layerDefinitionModel,
      templates: [
        {
          value: '',
          label: _t('editor.layers.infowindow.style.none')
        }, {
          value: 'infowindow_light',
          label: _t('editor.layers.infowindow.style.light')
        }
      ]
    });
    view.render();
  });

  it('should render items if is fetched', function () {
    expect(_.size(view._subviews)).toBe(0);
    view._querySchemaModel.set({
      'status': 'fetched'
    });
    expect(_.size(view._subviews)).toBe(2); // carousel, and items
  });

  it('should render/add style + fields for infowindow', function () {
    view._querySchemaModel.set({
      'status': 'fetched'
    });
    expect(_.size(view._subviews)).toBe(2); // carousel, and items
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
