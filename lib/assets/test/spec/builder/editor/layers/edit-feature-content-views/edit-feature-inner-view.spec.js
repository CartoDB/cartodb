var _ = require('underscore');
var Backbone = require('backbone');
var EditFeatureInnerView = require('builder/editor/layers/edit-feature-content-views/edit-feature-inner-view');
var EditFeatureGeometryFormModel = require('builder/editor/layers/edit-feature-content-views/edit-feature-geometry-form-model');
var EditFeatureAttributesFormModel = require('builder/editor/layers/edit-feature-content-views/edit-feature-attributes-form-model');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryColumnsCollection = require('builder/data/query-columns-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');

describe('editor/layers/edit-feature-content-views/edit-feature-inner-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
    });
    this.userModel = new UserModel({}, {
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

    this.querySchemaModel = new QuerySchemaModel({}, {
      configModel: this.configModel
    });

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
    this.featureModel.isPoint = function () { return false; };
    this.featureModel.getFeatureType = function () { return 'line'; };

    this.view = new EditFeatureInnerView({
      featureModel: this.featureModel,
      geometryFormModel: this.geometryFormModel,
      attributesFormModel: this.attributesFormModel
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(2); // geometry, attributes
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
