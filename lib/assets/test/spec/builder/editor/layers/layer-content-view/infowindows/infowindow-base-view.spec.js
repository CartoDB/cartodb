var _ = require('underscore');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var InfowindowBaseView = require('builder/editor/layers/layer-content-views/infowindow/infowindow-base-view');
var InfowindowDefinitionModel = require('builder/data/infowindow-definition-model');
var EditorModel = require('builder/data/editor-model');
var ScrollView = require('builder/components/scroll/scroll-view');

var TEMPLATES = [
  {
    value: '',
    infowindowIcon: require('builder/editor/layers/layer-content-views/infowindow/infowindow-icons/infowindow-none.tpl'),
    label: _t('editor.layers.infowindow.style.none'),
    tooltip: _t('editor.layers.infowindow.tooltips.none')
  }, {
    value: 'infowindow_light',
    infowindowIcon: require('builder/editor/layers/layer-content-views/infowindow/infowindow-icons/infowindow-light.tpl'),
    label: _t('editor.layers.infowindow.style.infowindow_light'),
    tooltip: _t('editor.layers.infowindow.tooltips.infowindow_light')
  }
];

describe('editor/layers/layer-content-view/infowindow/infowindow-base-view', function () {
  var view;
  var layerDefinitionModel;
  var editorModel;
  var model;
  var renderSpy;
  var onChangeSpy;
  var infoboxStateSpy;
  var onChangeEditionSpy;
  var onChangeDisabledSpy;
  var onTogglerChangedSpy;
  var toggleOverlaySpy;

  var createViewFn = function (options) {
    layerDefinitionModel = new LayerDefinitionModel({
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

    editorModel = new EditorModel({
      disabled: false
    });

    model = new InfowindowDefinitionModel({
      template: '',
      template_name: ''
    }, {
      configModel: {}
    });
    model.hasTemplate = function () { return true; };

    InfowindowBaseView.prototype._initTemplates = function () { return TEMPLATES; };
    spyOn(ScrollView.prototype, 'render').and.returnValue(this);

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
    renderSpy = spyOn(InfowindowBaseView.prototype, 'render');
    onChangeSpy = spyOn(InfowindowBaseView.prototype, '_onChange');
    infoboxStateSpy = spyOn(InfowindowBaseView.prototype, '_infoboxState');
    onChangeEditionSpy = spyOn(InfowindowBaseView.prototype, '_onChangeEdition');
    onChangeDisabledSpy = spyOn(InfowindowBaseView.prototype, '_onChangeDisabled');
    onTogglerChangedSpy = spyOn(InfowindowBaseView.prototype, '_onTogglerChanged');
    toggleOverlaySpy = spyOn(InfowindowBaseView.prototype, '_toggleOverlay');

    view = createViewFn();
  });

  describe('.render', function () {
    it('should render properly', function () {
      renderSpy.and.callThrough();

      spyOn(view, '_initViews');

      view.render();

      expect(view._initViews).toHaveBeenCalled();
      expect(infoboxStateSpy).toHaveBeenCalled();
      expect(toggleOverlaySpy).toHaveBeenCalled();
    });

    it('should have no leaks', function () {
      renderSpy.and.callThrough();

      view.render();

      expect(view).toHaveNoLeaks();
    });
  });

  describe('._initBinds', function () {
    it('should listen to model change', function () {
      view.model.set('wadus', true);

      expect(onChangeSpy).toHaveBeenCalled();
    });

    it('should listen to layerDefinitionModel change visible', function () {
      layerDefinitionModel.set('visible', false);

      expect(infoboxStateSpy).toHaveBeenCalled();
    });

    it('should listen to editorModel change edition', function () {
      view._editorModel.set('edition', true);

      expect(onChangeEditionSpy).toHaveBeenCalled();
    });

    it('should listen to editorModel change disabled', function () {
      view._editorModel.set('disabled', true);

      expect(onChangeDisabledSpy).toHaveBeenCalled();
    });

    it('should listen to togglerModel change active', function () {
      view._togglerModel.set('active', true);

      expect(onTogglerChangedSpy).toHaveBeenCalled();
    });

    it('should listen to overlayModel change visible', function () {
      view._overlayModel.set('visible', true);

      expect(toggleOverlaySpy).toHaveBeenCalled();
    });
  });

  describe('._initViews', function () {
    it('should init views', function () {
      view._initViews();

      expect(_.size(view._subviews)).toBe(1); // ['PanelWithOptionsView']
    });
  });
});
