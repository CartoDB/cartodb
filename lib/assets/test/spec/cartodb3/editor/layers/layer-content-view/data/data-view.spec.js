var Backbone = require('backbone');
var _ = require('underscore');
var LayerDefinitionsCollection = require('../../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var DataView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-view');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');

describe('editor/layers/layers-content-view/data/data-view', function () {
  beforeEach(function () {
    this.layerDefinitionModel = new Backbone.Model();

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      analysisDefinitionsCollection: new Backbone.Collection(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      configModel: {},
      mapId: 'map-123',
      basemaps: {}
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });

    spyOn(this.layerDefinitionsCollection, 'isThereAnyTorqueLayer').and.returnValue(false);

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () { return false; };

    this.view = new DataView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      querySchemaModel: this.querySchemaModel,
      modals: new Backbone.Model(),
      editorModel: this.editorModel,
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

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
