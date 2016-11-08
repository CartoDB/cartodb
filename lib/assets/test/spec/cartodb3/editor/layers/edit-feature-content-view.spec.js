var _ = require('underscore');
var Backbone = require('backbone');
var EditFeatureContentView = require('../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-view');
var MapModeModel = require('../../../../../javascripts/cartodb3/map-mode-model');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var FeatureDefinitionModel = require('../../../../../javascripts/cartodb3/data/feature-definition-model');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');

describe('editor/layers/edit-feature-content-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel
    });

    var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'm-123'
    });
    layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo'
      }
    });
    this.layerDefinitionModel = layerDefinitionsCollection.at(0);

    this.mapModeModel = new MapModeModel();
    this.editorModel = new EditorModel();

    var featureDefinition = new FeatureDefinitionModel({}, {
      configModel: this.configModel,
      layerDefinitionModel: this.layerDefinitionModel
    });
    this.mapModeModel.enterDrawingFeatureMode(featureDefinition);

    this.view = new EditFeatureContentView({
      layerDefinitionModel: this.layerDefinitionModel,
      configModel: this.configModel,
      stackLayoutModel: {},
      mapModeModel: this.mapModeModel,
      editorModel: this.editorModel,
      model: new Backbone.Model({
        hasChanges: false
      }),
      modals: {}
    });
    spyOn(this.view, '_addRow').and.callThrough();
    spyOn(this.view, '_renderInfo').and.callThrough();

    this.view.render();
  });

  it('should get table details', function () {
    expect(this.view._tableName).toBe('foo');
    expect(this.view._url).toBe('/u/pepe/dataset/foo');
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(2); // header, content
  });

  describe('when feature is new', function () {
    it('should add row', function () {
      expect(this.view._addRow).toHaveBeenCalled();
      expect(this.view._renderInfo).toHaveBeenCalled();
    });
  });

  describe('when feature already exists', function () {
    var view;

    beforeEach(function () {
      var featureDefinition = new FeatureDefinitionModel({
        cartodb_id: 1
      }, {
        configModel: this.configModel,
        layerDefinitionModel: this.layerDefinitionModel
      });
      featureDefinition.fetch();

      this.mapModeModel.enterEditingFeatureMode(featureDefinition);

      view = new EditFeatureContentView({
        layerDefinitionModel: this.layerDefinitionModel,
        configModel: this.configModel,
        stackLayoutModel: {},
        mapModeModel: this.mapModeModel,
        editorModel: this.editorModel,
        model: new Backbone.Model({
          hasChanges: false
        }),
        modals: {}
      });
      spyOn(view, '_addRow').and.callThrough();
      spyOn(view, '_renderInfo').and.callThrough();

      view.render();
    });

    it('should not add row', function () {
      expect(view._addRow).not.toHaveBeenCalled();
      expect(view._renderInfo).toHaveBeenCalled();
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
