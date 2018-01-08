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
  var toggleOverlaySpy;

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

    InfowindowBaseView.prototype._initTemplates = function () {};


    spyOn(InfowindowBaseView.prototype, '_onChange');
    spyOn(InfowindowBaseView.prototype, '_infoboxState');
    spyOn(InfowindowBaseView.prototype, '_onChangeEdition');
    spyOn(InfowindowBaseView.prototype, '_onChangeDisabled');
    spyOn(InfowindowBaseView.prototype, '_onTogglerChanged');
    spyOn(InfowindowBaseView.prototype, '_initViews');
    toggleOverlaySpy = spyOn(InfowindowBaseView.prototype, '_toggleOverlay');

    view = new InfowindowBaseView({
      model: model,
      editorModel: editorModel,
      layerDefinitionModel: layerDefinitionModel,
      userActions: {},
      querySchemaModel: {}
    });

    view._templates = TEMPLATES;

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view.render();

      expect(view._initViews).toHaveBeenCalled();
      expect(view._infoboxState).toHaveBeenCalled();
      expect(view._toggleOverlay).toHaveBeenCalled();
    });

    it('should have no leaks', function () {
      view.render();
      expect(view).toHaveNoLeaks();
    });
  });

  describe('.initBinds', function () {
    it('should call ._onChange when model changes', function () {
      view._initBinds();
      view.model.trigger('change');
      expect(view._onChange).toHaveBeenCalled();
    });

    it('should call ._infoboxState when _layerDefinitionModel:visible changes', function () {
      view._initBinds();
      view._layerDefinitionModel.trigger('change:visible');
      expect(view._infoboxState).toHaveBeenCalled();
    });

    it('should call ._onChangeEdition when _editorModel:edition changes', function () {
      view._initBinds();
      view._editorModel.trigger('change:edition');
      expect(view._onChangeEdition).toHaveBeenCalled();
    });

    it('should call ._onChangeDisabled when _editorModel:disabled changes', function () {
      view._initBinds();
      view._editorModel.trigger('change:disabled');
      expect(view._onChangeDisabled).toHaveBeenCalled();
    });

    it('should call ._onTogglerChanged when _togglerModel:active changes', function () {
      view._initBinds();
      view._togglerModel.trigger('change:active');
      expect(view._onTogglerChanged).toHaveBeenCalled();
    });

    it('should call ._toggleOverlay when _overlayModel:visible changes', function () {
      view._initBinds();
      view._overlayModel.trigger('change:visible');
      expect(view._toggleOverlay).toHaveBeenCalled();
    });
  });
});
