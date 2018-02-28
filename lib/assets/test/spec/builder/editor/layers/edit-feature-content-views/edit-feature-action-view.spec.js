var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var EditFeatureActionView = require('builder/editor/layers/edit-feature-content-views/edit-feature-action-view');
var EditFeatureGeometryFormModel = require('builder/editor/layers/edit-feature-content-views/edit-feature-geometry-form-model');
var EditFeatureAttributesFormModel = require('builder/editor/layers/edit-feature-content-views/edit-feature-attributes-form-model');
var QueryColumnsCollection = require('builder/data/query-columns-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');

describe('editor/layers/edit-feature-content-views/edit-feature-action-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
    });
    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.querySchemaModel = new QuerySchemaModel({}, {
      configModel: this.configModel
    });

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel
    });

    var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });
    layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo'
      }
    });
    var layerDefinitionModel = layerDefinitionsCollection.at(0);

    this.columnsCollection = new QueryColumnsCollection([
      {
        name: 'cartodb_id',
        type: 'number'
      }, {
        name: 'name',
        type: 'string'
      }, {
        name: 'description',
        type: 'string'
      }, {
        name: 'the_geom',
        type: 'geometry'
      }
    ], {
      querySchemaModel: this.querySchemaModel,
      configModel: this.configModel
    });

    this.featureModel = new Backbone.Model({
      the_geom: '{"type":"LineString","coordinates":[[0,0],[0,1]]}',
      name: '',
      description: ''
    });

    this.geometryFormModel = new EditFeatureGeometryFormModel(this.featureModel.toJSON(), {
      featureModel: this.featureModel
    });

    this.attributesFormModel = new EditFeatureAttributesFormModel(this.featureModel.toJSON(), {
      featureModel: this.featureModel,
      columnsCollection: this.columnsCollection,
      configModel: this.configModel,
      nodeDefModel: layerDefinitionModel.getAnalysisDefinitionNodeModel()
    });

    this.model = new Backbone.Model({
      hasChanges: false,
      isValidAttributes: true,
      isValidGeometry: true
    });

    this.view = new EditFeatureActionView({
      model: this.model,
      featureModel: this.featureModel,
      geometryFormModel: this.geometryFormModel,
      attributesFormModel: this.attributesFormModel
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-save').length).toBe(1);
  });

  it('button should be disabled by default', function () {
    expect(this.view.$el.html()).toContain('is-disabled');
  });

  it('should update model if feature changes', function () {
    expect(this.model.get('hasChanges')).toBe(false);
    this.featureModel.set('the_geom', '{"type":"LineString","coordinates":[[0,0],[1,1]]}');
    expect(this.model.get('hasChanges')).toBe(true);
  });

  describe('when is new', function () {
    beforeEach(function () {
      this.featureModel.isNew = function () { return true; };
    });

    it('button should be add', function () {
      expect(this.view.$el.html()).toContain('editor.edit-feature.add');
    });
  });

  describe('when feature already exists', function () {
    beforeEach(function () {
      this.featureModel.isNew = function () { return false; };

      this.view.render();
    });

    it('button should be save', function () {
      expect(this.view.$el.html()).toContain('editor.edit-feature.save');
    });
  });

  describe('save feature', function () {
    beforeEach(function () {
      spyOn(this.featureModel, 'save');
    });

    describe('when has no changes', function () {
      beforeEach(function () {
        this.view.$('.js-save').click();
      });

      it('button should be disabled', function () {
        expect(this.view.$el.html()).toContain('is-disabled');
      });
    });

    describe('when has changes', function () {
      beforeEach(function () {
        spyOn(this.featureModel, 'trigger');
        this.model.set('hasChanges', true);

        this.view.$('.js-save').click();
      });

      it('should save the feature model', function () {
        expect(this.featureModel.save).toHaveBeenCalled();
      });

      describe('when save succeeds', function () {
        it('should update changes', function () {
          this.featureModel.save.calls.argsFor(0)[0].success();

          expect(this.model.get('hasChanges')).toBe(false);
          expect(this.featureModel.trigger).toHaveBeenCalledWith('saveFeatureSuccess', 'add', this.featureModel);
        });
      });

      describe('when save fails', function () {
        it('should not have changes', function () {
          this.featureModel.save.calls.argsFor(0)[0].error();

          expect(this.model.get('hasChanges')).toBe(true);
          expect(this.featureModel.trigger).toHaveBeenCalledWith('saveFeatureFailed');
        });
      });
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
