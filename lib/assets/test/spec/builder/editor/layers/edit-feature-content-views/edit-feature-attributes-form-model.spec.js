var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryColumnsCollection = require('builder/data/query-columns-collection');
var EditFeatureAttributesFormModel = require('builder/editor/layers/edit-feature-content-views/edit-feature-attributes-form-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var UserModel = require('builder/data/user-model');
var CDB = require('internal-carto.js');

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
      }, {
        name: 'coordonnees',
        type: 'number[]'
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
      updated_at: '2016-10-21T11:27:39+00:00',
      coordonnees: '48.1100259201,-1.6780371631'
    });

    this.formModel = new EditFeatureAttributesFormModel(this.featureModel.toJSON(), {
      featureModel: this.featureModel,
      columnsCollection: this.columnsCollection,
      configModel: this.configModel,
      nodeDefModel: this.layerDefinitionModel.getAnalysisDefinitionNodeModel()
    });
  });

  it('should generate schema from columns collection, omit reserved columns, and assign default Text type', function () {
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
        'type': 'DateTime',
        'dialogMode': 'float'
      },
      'coordonnees': {
        'type': 'Text'
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
        spyOn(CDB.SQL.prototype, 'execute').and.callFake(function (query, vars, params) {
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
        });

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
        spyOn(CDB.SQL.prototype, 'execute').and.callFake(function (query, vars, params) {
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
        });

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
          cartodb_id: {
            type: 'Number',
            isFormatted: false,
            showSlider: false,
            editorAttrs: {
              disabled: true
            }
          },
          names: {
            type: 'Suggest',
            dialogMode: 'float',
            editorAttrs: {
              showSearch: true,
              defaultValue: true,
              allowFreeTextInput: true,
              collectionData: [ 'pepe', 'paco', 'juan' ]
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
