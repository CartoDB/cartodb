var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var InfowindowContentView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-content-view');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var EditorModel = require('../../../../../../../javascripts/cartodb3/data/editor-model');

describe('editor/layers/layer-content-view/infowindow/infowindow-content-view', function () {
  var view, model, overlayModel;

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
      infowindow: {},
      tooltip: {}
    }, {
      parse: true,
      configModel: this.configModel
    });

    model = new InfowindowDefinitionModel({}, {
      configModel: this.configModel
    });

    overlayModel = new Backbone.Model({
      visible: false
    });

    view = new InfowindowContentView({
      userActions: {},
      configModel: this.configModel,
      querySchemaModel: this.querySchemaModel,
      model: model,
      layerDefinitionModel: this.layerDefinitionModel,
      overlayModel: overlayModel,
      editorModel: new EditorModel(),
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
    view._querySchemaModel.set({
      'status': 'fetched'
    });
    expect(_.size(view._subviews)).toBe(3); // overlay, style carousel, and infowindow fields
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
