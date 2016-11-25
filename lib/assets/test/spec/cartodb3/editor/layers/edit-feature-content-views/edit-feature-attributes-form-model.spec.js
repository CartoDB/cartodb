var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryColumnsCollection = require('../../../../../../javascripts/cartodb3/data/query-columns-collection');
var EditFeatureAttributesFormModel = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-attributes-form-model');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var CDB = require('cartodb.js');

describe('editor/layers/edit-feature-content-views/edit-feature-attributes-form-model', function () {
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
      configModel: this.configModel
    });

    var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel,
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
      columnsCollection: this.columnsCollection,
      configModel: this.configModel,
      nodeDefModel: this.layerDefinitionModel.getAnalysisDefinitionNodeModel()
    });
  });

  it('should generate schema from columns collection and omit reserved columns', function () {
    expect(this.formModel.schema).toEqual({
      'cartodb_id': {
        'type': 'Number',
        'isFormatted': false,
        'showSlider': false,
        'editorAttrs': {
          'disabled': true
        }
      },
      'string': {
        'type': 'Text'
      },
      'boolean': {
        'type': 'Radio',
        'options': [
          {
            'label': 'form-components.editors.radio.true',
            'val': true
          },
          {
            'label': 'form-components.editors.radio.false',
            'val': false
          },
          {
            'label': 'form-components.editors.radio.null',
            'val': null
          }
        ]
      },
      'number': {
        'type': 'Number',
        'isFormatted': true,
        'showSlider': false
      },
      'date': {
        'type': 'DateTime'
      }
    });
  });

  describe('when there is a column of type string', function () {
    beforeEach(function () {
      this.columnsCollection = new QueryColumnsCollection([
        {
          name: 'cartodb_id',
          type: 'number'
        }, {
          name: 'names',
          type: 'string'
        }
      ], {
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel
      });

      this.featureModel = new Backbone.Model({
        cartodb_id: 1,
        names: 'carlos'
      });
    });

    describe('when all values are null', function () {
      var formModel;

      beforeEach(function () {
        CDB.SQL.prototype.execute = function (query, vars, params) {
          params && params.success({
            rows: [{
              names: null
            }, {
              names: null
            }, {
              names: null
            }],
            fields: []
          });
        };

        spyOn(EditFeatureAttributesFormModel.prototype, '_onChangeSchema');

        formModel = new EditFeatureAttributesFormModel(this.featureModel.toJSON(), {
          featureModel: this.featureModel,
          columnsCollection: this.columnsCollection,
          configModel: this.configModel,
          nodeDefModel: this.layerDefinitionModel.getAnalysisDefinitionNodeModel()
        });
      });

      it('should', function () {
        expect(EditFeatureAttributesFormModel.prototype._onChangeSchema).not.toHaveBeenCalled();

        expect(formModel.schema).toEqual({
          'cartodb_id': {
            'type': 'Number',
            'isFormatted': false,
            'showSlider': false,
            'editorAttrs': {
              'disabled': true
            }
          },
          'names': {
            'type': 'Text'
          }
        });
      });
    });

    describe('when not all values are null', function () {
      var formModel;

      beforeEach(function () {
        CDB.SQL.prototype.execute = function (query, vars, params) {
          params && params.success({
            rows: [{
              names: 'pepe'
            }, {
              names: 'paco'
            }, {
              names: 'juan'
            }],
            fields: []
          });
        };

        spyOn(EditFeatureAttributesFormModel.prototype, '_onChangeSchema');

        formModel = new EditFeatureAttributesFormModel(this.featureModel.toJSON(), {
          featureModel: this.featureModel,
          columnsCollection: this.columnsCollection,
          configModel: this.configModel,
          nodeDefModel: this.layerDefinitionModel.getAnalysisDefinitionNodeModel()
        });
      });

      it('should', function () {
        expect(EditFeatureAttributesFormModel.prototype._onChangeSchema).toHaveBeenCalled();

        expect(formModel.schema).toEqual({
          'cartodb_id': {
            'type': 'Number',
            'isFormatted': false,
            'showSlider': false,
            'editorAttrs': {
              'disabled': true
            }
          },
          'names': {
            'type': 'Suggest',
            'editorAttrs': {
              'showSearch': true,
              'allowFreeTextInput': true,
              'collectionData': [ 'pepe', 'paco', 'juan' ]
            }
          }
        });
      });
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
