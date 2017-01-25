var _ = require('underscore');
var Dictionary = require('../../../../../../javascripts/cartodb3/editor/style/style-form/style-form-components-dictionary');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryGeometryModel = require('../../../../../../javascripts/cartodb3/data/query-geometry-model');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/style/style-form/style-form-components-dictionary', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/hey'
    });

    this.queryGeometryModel = new QueryGeometryModel({
      status: 'fetched',
      query: 'SELECT * FROM dataset',
      simple_geom: 'point'
    }, {
      configModel: this.configModel
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
        styleType: 'simple',
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: {}
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

    it('should provide proper options with aggregation types', function () {
      checkAggregatedOptions({
        componentName: 'fill',
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: this.queryGeometryModel,
        configModel: this.configModel
      });
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
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: 'simple',
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: {}
      });

      expect(componentDef.help).toBe('');
      expect(componentDef.options.length).toBe(4);
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
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: 'simple',
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: {}
      });

      expect(componentDef.help).not.toBe('');
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        min: 0,
        max: 50,
        disabled: true
      }));
    });

    it('should generate the definition for point geometry', function () {
      this.queryGeometryModel.set('simple_geom', 'point');

      var componentDef = Dictionary['stroke']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: 'simple',
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: {}
      });

      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        size: {
          min: 0,
          max: 10,
          step: 0.5,
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['value']
        }
      }));
    });

    it('should generate the definition for polygon geometry', function () {
      this.queryGeometryModel.set('simple_geom', 'polygon');

      var componentDef = Dictionary['stroke']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: 'simple',
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: {}
      });

      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        size: {
          min: 0,
          max: 10,
          step: 0.5,
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['value']
        }
      }));
    });
  });

  describe('blending', function () {
    it('should provide only four options when style is animation', function () {
      var componentDef = Dictionary['blending']({
        styleType: 'animation'
      });

      expect(componentDef.options.length).toBe(4);
    });

    it('should provide rest of options when style is not animation', function () {
      var componentDef = Dictionary['blending']({
        styleType: 'simple'
      });

      expect(componentDef.options.length).toBe(10);
    });
  });

  describe('aggregation-dataset', function () {
    it('should only provide two options, countries and provinces', function () {
      var componentDef = Dictionary['aggregation-dataset']({
        styleType: 'squares'
      });

      expect(componentDef.options.length).toBe(2);
      expect(componentDef.options[0].val).toBe('countries');
      expect(componentDef.options[1].val).toBe('provinces');
    });
  });

  describe('labels-attribute', function () {
    it('should not include date or the_geom/the_geom_webmercator columns as option', function () {
      this.querySchemaModel.columnsCollection.reset([
        {
          name: 'figure',
          type: 'number'
        }, {
          name: 'text',
          type: 'string'
        }, {
          name: 'the_geom_webmercator',
          type: 'geometry'
        }, {
          name: 'the_geom',
          type: 'geometry'
        }, {
          name: 'timestamp',
          type: 'date'
        }
      ]);

      var componentDef = Dictionary['labels-attribute']({
        querySchemaModel: this.querySchemaModel,
        styleType: 'simple'
      });

      expect(componentDef.options.length).toBe(2);
      expect(componentDef.options[0].val).toBe('figure');
      expect(componentDef.options[1].val).toBe('text');
    });

    it('should provide proper options with aggregation types', function () {
      checkAggregatedOptions({
        componentName: 'labels-attribute',
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: this.queryGeometryModel,
        configModel: this.configModel
      });
    });

    it('should provide proper options with aggregation types', function () {
      checkAggregatedOptions({
        componentName: 'fill',
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: this.queryGeometryModel,
        configModel: this.configModel
      });
    });
  });

  describe('labels-halo', function () {
    it('should hide some panels', function () {
      var componentDef = Dictionary['labels-halo']({
        styleType: 'simple'
      });

      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        size: {
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['value']
        }
      }));
    });
  });

  describe('labels-placement', function () {
    it('should generate four options', function () {
      var componentDef = Dictionary['labels-placement']({
        styleType: 'simple'
      });

      expect(componentDef.options.length).toBe(4);
      expect(componentDef.options[0].val).toBe('point');
      expect(componentDef.options[1].val).toBe('line');
      expect(componentDef.options[2].val).toBe('vertex');
      expect(componentDef.options[3].val).toBe('interior');
    });
  });

  describe('animated-attribute', function () {
    it('should contain only date or number options', function () {
      this.querySchemaModel.columnsCollection.reset([
        {
          name: 'figure',
          type: 'number'
        }, {
          name: 'text',
          type: 'string'
        }, {
          name: 'the_geom_webmercator',
          type: 'geometry'
        }, {
          name: 'the_geom',
          type: 'geometry'
        }, {
          name: 'timestamp',
          type: 'date'
        }
      ]);

      var componentDef = Dictionary['animated-attribute']({
        querySchemaModel: this.querySchemaModel,
        styleType: 'animation'
      });

      expect(componentDef.options.length).toBe(2);
      expect(componentDef.options[0].val).toBe('figure');
      expect(componentDef.options[1].val).toBe('timestamp');
    });
  });

  function checkAggregatedOptions (params) {
    var aggregatedOptions = {
      'heatmap': {
        size: 1,
        values: ['cartodb_id']
      },
      'hexabins': {
        size: 1,
        values: ['agg_value']
      },
      'squares': {
        size: 1,
        values: ['agg_value']
      },
      'regions': {
        size: 2,
        values: ['agg_value', 'agg_value_density']
      }
    };

    _.each(aggregatedOptions, function (result, type) {
      var componentDef = Dictionary[params.componentName]({
        querySchemaModel: params.querySchemaModel,
        queryGeometryModel: params.queryGeometryModel,
        configModel: params.configModel,
        styleType: type
      });
      expect(componentDef.options.length).toBe(result.size);
      var options = _.pluck(componentDef.options, 'val');
      expect(options).toEqual(result.values);
    });
  }
});
