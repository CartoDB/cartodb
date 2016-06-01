var Backbone = require('backbone');
var _ = require('underscore');
var StyleModel = require('../../../../../javascripts/cartodb3/editor/style/style-definition-model');
var QuerySchemaModel = require('../../../../../javascripts/cartodb3/data/query-schema-model');
var CartoCSSModel = require('../../../../../javascripts/cartodb3/editor/style/style-cartocss-model');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var StyleView = require('../../../../../javascripts/cartodb3/editor/style/style-view');

describe('editor/style/style-view', function () {
  beforeEach(function () {
    this.styleModel = new StyleModel({}, { parse: true });
    this.cartocssModel = new CartoCSSModel();

    this.layerDefinitionModel = new Backbone.Model();
    this.layerDefinitionModel.styleModel = this.styleModel;
    this.layerDefinitionModel.cartocssModel = this.cartocssModel;
    spyOn(this.layerDefinitionModel, 'sync');

    this.querySchemaModel = new QuerySchemaModel({
      status: 'fetched'
    }, {
      configModel: {}
    });
    spyOn(this.querySchemaModel, 'getGeometry').and.returnValue({
      getSimpleType: function () { return 'point'; }
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      analysisDefinitionsCollection: new Backbone.Collection(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      configModel: {},
      mapId: 'map-123',
      basemaps: []
    });
    spyOn(this.layerDefinitionsCollection, 'isThereAnyTorqueLayer').and.returnValue(false);

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () { return false; };

    this.view = new StyleView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      querySchemaModel: this.querySchemaModel,
      modals: new Backbone.Model(),
      editorModel: this.editorModel
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should create internal codemirror model', function () {
    expect(this.view._codemirrorModel).toBeDefined();
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
  });

  it('should save cartocss', function () {
    var content = '#layer {marker-fill:red}';
    this.view._codemirrorModel.set('content', content);
    this.view._saveCartoCSS();
    expect(this.view._cartocssModel.get('content')).toBe(content);
    expect(this.view._layerDefinitionModel.get('cartocss_custom')).toBeTruthy();
    expect(this.view._layerDefinitionModel.get('cartocss')).toBe(content);
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
