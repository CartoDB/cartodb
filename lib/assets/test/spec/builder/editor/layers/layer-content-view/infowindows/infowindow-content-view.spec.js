var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var InfowindowContentView = require('builder/editor/layers/layer-content-views/infowindow/infowindow-content-view');
var QuerySchemaModel = require('builder/data/query-schema-model');
var InfowindowDefinitionModel = require('builder/data/infowindow-definition-model');
var EditorModel = require('builder/data/editor-model');
var ConfigModel = require('builder/data/config-model');

describe('editor/layers/layer-content-view/infowindow/infowindow-content-view', function () {
  var view;
  var model;
  var querySchemaModel;
  var layerDefinitionModel;
  var overlayModel;
  var editorModel;
  var renderItemsSpy;
  var updateEditorSpy;

  beforeEach(function () {
    var configModel = new ConfigModel();

    querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table'
    }, {
      configModel: configModel
    });
    spyOn(querySchemaModel, 'fetch');

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
      configModel: configModel
    });

    model = new InfowindowDefinitionModel({
      template: '',
      template_name: ''
    }, {
      configModel: configModel
    });
    model.hasTemplate = function () { return true; };

    overlayModel = new Backbone.Model({
      visible: false
    });

    editorModel = new EditorModel({
      disabled: false
    });

    renderItemsSpy = spyOn(InfowindowContentView.prototype, '_renderItems');
    updateEditorSpy = spyOn(InfowindowContentView.prototype, '_updateEditor');

    view = new InfowindowContentView({
      querySchemaModel: querySchemaModel,
      model: model,
      layerDefinitionModel: layerDefinitionModel,
      overlayModel: overlayModel,
      editorModel: editorModel,
      templates: [{
        value: ''
      }, {
        value: 'infowindow_light'
      }]
    });
  });

  describe('render', function () {
    it('should render properly', function () {
      spyOn(view, '_initViews');

      view.render();

      expect(view._initViews).toHaveBeenCalled();
    });

    it('should have no leaks', function () {
      view.render();

      expect(view).toHaveNoLeaks();
    });
  });

  describe('_initBinds', function () {
    it('should listen to model change template_name', function () {
      model.set('template_name', 'wadus');

      expect(renderItemsSpy).toHaveBeenCalled();
    });

    it('should listen to model change template', function () {
      model.set('template', 'wadus');

      expect(updateEditorSpy).toHaveBeenCalled();
    });
  });

  describe('_initViews', function () {
    it('should init views', function () {
      view._initViews();

      expect(_.size(view._subviews)).toBe(1); // ['InfowindowSelectView']
      expect(renderItemsSpy).toHaveBeenCalled();
    });
  });

  describe('_renderItems', function () {
    it('should render items', function () {
      renderItemsSpy.and.callThrough();

      view._renderItems();

      expect(_.size(view._subviews)).toBe(1); // ['InfowindowItemsView']
    });
  });

  describe('_initCollection', function () {
    it('should init collection', function () {
      view._initCollection();

      expect(view._templatesCollection).toBeDefined();
      expect(view._templatesCollection.size()).toBe(2);
    });
  });

  describe('_updateEditor', function () {
    beforeEach(function () {
      updateEditorSpy.and.callThrough();
    });

    it('shouln\'t update editor', function () {
      expect(editorModel.get('disabled')).toBe(false);

      view._updateEditor();

      expect(editorModel.get('disabled')).toBe(false);
    });

    describe('model hasn\'t template', function () {
      it('should update editor', function () {
        model.hasTemplate = function () { return false; };

        expect(editorModel.get('disabled')).toBe(false);

        view._updateEditor();

        expect(editorModel.get('disabled')).toBe(true);
      });
    });
  });

  describe('_checkValidTemplate', function () {
    it('should check valid template', function () {
      expect(view._checkValidTemplate()).toBe(false);
    });

    describe('with valid template', function () {
      it('should check valid template', function () {
        view.model.set('template_name', 'infowindow_light');

        expect(view._checkValidTemplate()).toBe(true);
      });
    });
  });
});
