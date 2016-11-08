var _ = require('underscore');
var Backbone = require('backbone');
var EditFeatureInnerView = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-inner-view');
var EditFeatureGeometryFormModel = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-geometry-form-model');
var EditFeatureAttributesFormModel = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-attributes-form-model');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryColumnsCollection = require('../../../../../../javascripts/cartodb3/data/query-columns-collection');

describe('editor/layers/edit-feature-content-views/edit-feature-inner-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

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
      columnsCollection: this.columnsCollection
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
