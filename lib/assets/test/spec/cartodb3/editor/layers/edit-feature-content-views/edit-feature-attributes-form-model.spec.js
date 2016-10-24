var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryColumnsCollection = require('../../../../../../javascripts/cartodb3/data/query-columns-collection');
var EditFeatureAttributesFormModel = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-attributes-form-model');

describe('editor/layers/edit-feature-content-views/edit-feature-attributes-form-model', function () {
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
        name: 'string',
        type: 'string'
      }, {
        name: 'boolean',
        type: 'boolean'
      }, {
        name: 'number',
        type: 'number'
      }, {
        name: 'date',
        type: 'date'
      }, {
        name: 'created_at',
        type: 'date'
      }, {
        name: 'the_geom',
        type: 'geometry'
      }, {
        name: 'the_geom_webmercator',
        type: 'geometry'
      }, {
        name: 'updated_at',
        type: 'date'
      }
    ], {
      querySchemaModel: this.querySchemaModel,
      configModel: this.configModel
    });

    this.featureModel = new Backbone.Model({
      cartodb_id: 1,
      string: 'string',
      boolean: false,
      number: 1,
      date: '2016-10-21T11:27:39+00:00',
      created_at: '2016-10-21T11:27:39+00:00',
      the_geom: '{"type":"Point","coordinates":[0,0]}',
      the_geom_webmercator: '{"type":"Point","coordinates":[0,0]}',
      updated_at: '2016-10-21T11:27:39+00:00'
    });

    this.formModel = new EditFeatureAttributesFormModel(this.featureModel.toJSON(), {
      featureModel: this.featureModel,
      columnsCollection: this.columnsCollection
    });
  });

  it('should generate schema from columns collection and omit reserved columns', function () {
    expect(this.formModel.schema).toEqual({
      cartodb_id: {
        type: 'Number',
        showSlider: false,
        editorAttrs: { disabled: true }
      },
      string: {
        type: 'Text'
      },
      boolean: {
        type: 'Text'
      },
      number: {
        type: 'Number',
        showSlider: false
      },
      date: {
        type: 'Text'
      }
    });
  });

  describe('when form data changes', function () {
    it('should update feature model', function () {
      expect(this.featureModel.get('boolean')).toBe(false);
      this.formModel.set('boolean', true);
      expect(this.featureModel.get('boolean')).toBe(true);
    });
  });
});
