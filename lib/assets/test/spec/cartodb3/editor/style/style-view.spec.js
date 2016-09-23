var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var StyleModel = require('../../../../../javascripts/cartodb3/editor/style/style-definition-model');
var QueryGeometryModel = require('../../../../../javascripts/cartodb3/data/query-geometry-model');
var QuerySchemaModel = require('../../../../../javascripts/cartodb3/data/query-schema-model');
var CartoCSSModel = require('../../../../../javascripts/cartodb3/editor/style/style-cartocss-model');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var StyleView = require('../../../../../javascripts/cartodb3/editor/style/style-view');
var UserActions = require('../../../../../javascripts/cartodb3/data/user-actions');

describe('editor/style/style-view', function () {
  beforeEach(function () {
    this.styleModel = new StyleModel({}, { parse: true });
    this.cartocssModel = new CartoCSSModel();

    this.layerDefinitionModel = new Backbone.Model();
    this.layerDefinitionModel.styleModel = this.styleModel;
    this.layerDefinitionModel.cartocssModel = this.cartocssModel;
    spyOn(this.layerDefinitionModel, 'sync');

    this.queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });
    this.queryGeometryModel.set('simple_geom', 'point');

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      configModel: {},
      mapId: 'map-123'
    });
    spyOn(this.layerDefinitionsCollection, 'isThereAnyTorqueLayer').and.returnValue(false);

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () { return false; };

    this.userActions = UserActions({
      userModel: {},
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });

    this.promise = $.Deferred();
    spyOn(this.userActions, 'saveLayer').and.returnValue(this.promise);

    this.view = new StyleView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      modals: new Backbone.Model(),
      editorModel: this.editorModel,
      userActions: this.userActions,
      configModel: {}
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should create internal codemirror model', function () {
    expect(this.view._codemirrorModel).toBeDefined();
  });

  it('should show infobox if layer is hidden', function () {
    this.layerDefinitionModel.set('visible', false);

    expect(this.view.$('.Infobox').length).toBe(1);
    expect(this.view.$('.Infobox').html()).toContain('editor.style.messages.layer-hidden');

    this.view._codemirrorModel.set('content', 'foo');
    this.editorModel.set('edition', true);

    // Infobox only visible in forms
    expect(this.view.$('.Infobox').length).toBe(0);

    this.editorModel.set('edition', false);
    expect(this.view.$('.Infobox').length).toBe(1);
    expect(this.view.$('.Infobox').html()).toContain('editor.style.messages.layer-hidden');

    this.layerDefinitionModel.set('visible', true);
    expect(this.view.$('.Infobox').length).toBe(0);
    expect(this.view.$('.Infobox').html()).not.toContain('editor.style.messages.layer-hidden');
  });

  it('should append existing Maps API errors to codemirror model when view is initialized', function () {
    this.layerDefinitionModel.set('error', {
      type: 'turbo-carto',
      line: 99,
      message: 'something went wrong'
    }); // setting this silently

    this.view = new StyleView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      modals: new Backbone.Model(),
      editorModel: this.editorModel,
      userActions: this.userActions,
      configModel: {}
    });

    expect(this.view._codemirrorModel.get('errors')).toEqual([{
      line: 99,
      message: 'something went wrong'
    }]);
  });

  describe('bindings', function () {
    it('should set codemirror value when style model changes', function () {
      spyOn(this.view._codemirrorModel, 'set');

      this.styleModel.set('type', 'squares');
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should set codemirror value when undo or redo is applied', function () {
      this.styleModel.set('type', 'hexabins');
      spyOn(this.view._codemirrorModel, 'set');

      this.styleModel.undo();
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();

      this.view._codemirrorModel.set.calls.reset();
      this.styleModel.redo();
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should append Maps API errors to existing codemirror errors', function () {
      this.view._codemirrorModel.set('errors', [
        { line: 0, message: 'error 1' }
      ]);

      this.layerDefinitionModel.set('error', {
        type: 'turbo-carto',
        line: 1,
        message: 'error 2'
      });

      expect(this.view._codemirrorModel.get('errors')).toEqual([
        { line: 0, message: 'error 1' },
        { line: 1, message: 'error 2' }
      ]);
    });
  });

  it('should save cartocss', function () {
    var content = '#layer {marker-fill:red}';
    this.view._codemirrorModel.set('content', content);

    this.view._saveCartoCSS();
    expect(this.view._cartocssModel.get('content')).toBe(content);
    expect(this.layerDefinitionModel.get('cartocss_custom')).toBeTruthy();
    expect(this.layerDefinitionModel.get('cartocss')).toBe(content);
    expect(this.userActions.saveLayer).toHaveBeenCalledWith(this.layerDefinitionModel);
  });

  it('should not save cartocss if content is empty', function () {
    var content = '';
    this.view._codemirrorModel.set('content', '');
    this.view._saveCartoCSS();
    expect(this.layerDefinitionModel.get('cartocss_custom')).toBeFalsy();
    expect(this.layerDefinitionModel.get('cartocss')).not.toBe(content);
    expect(this.userActions.saveLayer).not.toHaveBeenCalled();
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
