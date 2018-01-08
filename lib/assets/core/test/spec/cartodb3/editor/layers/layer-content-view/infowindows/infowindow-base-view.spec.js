var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var InfowindowBaseView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-base-view');
var InfowindowDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var EditorModel = require('../../../../../../../javascripts/cartodb3/data/editor-model');

var TEMPLATES = [
  {
    value: '',
    infowindowIcon: require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-icons/infowindow-none.tpl'),
    label: _t('editor.layers.infowindow.style.none'),
    tooltip: _t('editor.layers.infowindow.tooltips.none')
  }, {
    value: 'infowindow_light',
    infowindowIcon: require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-icons/infowindow-light.tpl'),
    label: _t('editor.layers.infowindow.style.infowindow_light'),
    tooltip: _t('editor.layers.infowindow.tooltips.infowindow_light')
  }
];

describe('editor/layers/layer-content-view/infowindow/infowindow-base-view', function () {
  var view;

  var createViewFn = function (options) {
    var layerDefinitionModel = new LayerDefinitionModel({
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
      configModel: {}
    });

    var editorModel = new EditorModel({
      disabled: false
    });

    var model = new InfowindowDefinitionModel({
      template: '',
      template_name: ''
    }, {
      configModel: {}
    });
    model.hasTemplate = function () { return true; };

    InfowindowBaseView.prototype._initTemplates = function () { return TEMPLATES; };

    return new InfowindowBaseView({
      model: model,
      editorModel: editorModel,
      layerDefinitionModel: layerDefinitionModel,
      userActions: {}
    });
  };

  beforeEach(function () {
    view = createViewFn();
  });

  describe('.render', function () {
    it('should render properly', function () {
      spyOn(view, '_initViews');
      spyOn(view, '_infoboxState');
      spyOn(view, '_toggleOverlay');

      view.render();

      expect(view._initViews).toHaveBeenCalled();
      expect(view._infoboxState).toHaveBeenCalled();
      expect(view._toggleOverlay).toHaveBeenCalled();
    });
  });

  it('should have no leaks', function () {
    view.render();
    expect(view).toHaveNoLeaks();
  });
});
