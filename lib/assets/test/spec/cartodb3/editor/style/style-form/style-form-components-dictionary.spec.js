var Dictionary = require('../../../../../../javascripts/cartodb3/editor/style/style-form/style-form-components-dictionary');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/style/style-form/style-form-components-dictionary', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/hey'
    });

    this.querySchemaModel = new QuerySchemaModel({
      status: 'fetched',
      query: 'SELECT * FROM dataset'
    }, {
      configModel: this.configModel
    });

    this.querySchemaModel.columnsCollection.reset([
      {
        name: 'figure',
        type: 'number'
      }, {
        name: 'text',
        type: 'string'
      }, {
        name: 'bool',
        type: 'boolean'
      }, {
        name: 'timestamp',
        type: 'date'
      }
    ]);
  });

  describe('fill', function () {
    it('should generate the component definition', function () {
      var componentDef = Dictionary['fill']({
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: 'simple'
      });
      expect(componentDef).toBeDefined();
      expect(componentDef.type).toBe('Fill');
      expect(componentDef.options.length).toBe(4);
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        size: {
          min: 1,
          max: 45,
          step: 0.5
        }
      }));
    });

    it('should have some changes when type is heatmap', function () {
      var componentDef = Dictionary['fill']({
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: 'heatmap'
      });
      expect(componentDef.options.length).toBe(1);
      expect(componentDef.options[0]).toEqual(jasmine.objectContaining({
        val: 'cartodb_id',
        type: 'number'
      }));
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        size: {
          min: 1,
          max: 45,
          step: 0.5,
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['fixed']
        }
      }));
    });

    it('should be different when type is simple animation', function () {
      var componentDef = Dictionary['fill']({
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        animationType: 'simple',
        styleType: 'animation'
      });
      expect(componentDef.options.length).toBe(4);
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        size: {
          min: 1,
          max: 45,
          step: 0.5,
          hidePanes: ['value']
        },
        color: {
          categorizeColumns: true
        }
      }));
    });

    it('should add/remove properties when type is heatmap animation', function () {
      var componentDef = Dictionary['fill']({
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        animationType: 'heatmap',
        styleType: 'animation'
      });
      expect(componentDef.options.length).toBe(1);
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        size: {
          min: 1,
          max: 45,
          step: 0.5,
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['fixed']
        }
      }));
    });
  });

  describe('stroke', function () {
    it('should generate the proper definition for line geometry', function () {
      this.queryGeometryModel.set('simple_geom', 'line');

      var componentDef = Dictionary['stroke']({
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: 'simple'
      });

      expect(componentDef.help).toBe('');
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        min: 0,
        max: 50,
        disabled: false
      }));
    });

    it('should be disabled and show help when schema is not ready', function () {
      this.queryGeometryModel.set('simple_geom', 'line');
      this.querySchemaModel.set('status', 'fetching');

      var componentDef = Dictionary['stroke']({
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: 'simple'
      });

      expect(componentDef.help).not.toBe('');
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        min: 0,
        max: 50,
        disabled: true
      }));
    });

    it('should generate the definition for point or polygon geometry', function () {
      this.queryGeometryModel.set('simple_geom', 'point');

      this.queryGeometryModel.set('simple_geom', 'polygon');
    });
  });
});
