var _ = require('underscore');
var Dictionary = require('builder/editor/style/style-form/style-form-components-dictionary');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var ConfigModel = require('builder/data/config-model');
var FactoryModals = require('../../../factories/modals');
var FillConstants = require('builder/components/form-components/_constants/_fill');
var StyleConstants = require('builder/components/form-components/_constants/_style');

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

    this.modals = FactoryModals.createModalService();
  });

  describe('aggregation-dataset', function () {
    it('should only provide two options, countries and provinces', function () {
      var componentDef = Dictionary['aggregation-dataset']({
        styleType: StyleConstants.Type.SQUARES
      });

      expect(componentDef.options.length).toBe(2);
      expect(componentDef.options[0].val).toBe('countries');
      expect(componentDef.options[1].val).toBe('provinces');
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
        styleType: StyleConstants.Type.ANIMATION
      });

      expect(componentDef.options.length).toBe(2);
      expect(componentDef.options[0].val).toBe('figure');
      expect(componentDef.options[1].val).toBe('timestamp');
    });
  });

  describe('animated-overlap', function () {
    it('should generate the component definition', function () {
      var componentDef = Dictionary['animated-overlap']({
        styleType: StyleConstants.Type.ANIMATION
      });

      expect(componentDef.type).toBe('Radio');
      expect(componentDef.options.length).toBe(2);
      expect(componentDef.options[0].val).toBe('false');
      expect(componentDef.options[1].val).toBe('true');
    });

    describe('is torque category', function () {
      it('should generate the component definition', function () {
        var componentDef = Dictionary['animated-overlap']({
          styleType: StyleConstants.Type.ANIMATION,
          isTorqueCategory: true
        });

        expect(componentDef.type).toBe('Hidden');
      });
    });
  });

  describe('blending', function () {
    it('should provide only four options when style is animation', function () {
      var componentDef = Dictionary['blending']({
        styleType: StyleConstants.Type.ANIMATION
      });

      expect(componentDef.options.length).toBe(4);
    });

    it('should provide rest of options when style is not animation', function () {
      var componentDef = Dictionary['blending']({
        styleType: StyleConstants.Type.SIMPLE
      });

      expect(componentDef.options.length).toBe(10);
    });
  });

  describe('fillSize', function () {
    it('should generate the component definition', function () {
      var componentDef = Dictionary['fillSize']({
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: this.queryGeometryModel,
        styleType: StyleConstants.Type.SIMPLE
      });
      expect(componentDef).toBeDefined();
      expect(componentDef.type).toBe('Size');
      expect(componentDef.options.length).toBe(4);
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining(_.extend({},
        FillConstants.Size.DEFAULT,
        {
          help: 'editor.style.tooltips.fill.size',
          geometryName: 'point'
        })
      ));
    });

    it('should provide proper options with aggregation types', function () {
      checkAggregatedOptions({
        componentName: 'fillSize',
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: this.queryGeometryModel,
        configModel: this.configModel
      });
    });

    it('should have some changes when type is heatmap', function () {
      var componentDef = Dictionary['fillSize']({
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: this.queryGeometryModel,
        styleType: 'heatmap'
      });
      expect(componentDef.options.length).toBe(1);
      expect(componentDef.options[0]).toEqual(jasmine.objectContaining({
        val: 'cartodb_id',
        type: 'number'
      }));
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining(_.extend({},
        FillConstants.Size.DEFAULT,
        {
          hidePanes: [FillConstants.Panes.BY_VALUE],
          help: 'editor.style.tooltips.fill.size'
        }
      )
      ));
    });

    describe('animated', function () {
      it('should be different when type is simple animation', function () {
        var componentDef = Dictionary['fillSize']({
          queryGeometryModel: this.queryGeometryModel,
          querySchemaModel: this.querySchemaModel,
          configModel: this.configModel,
          animationType: StyleConstants.Type.SIMPLE,
          styleType: StyleConstants.Type.ANIMATION,
          userModel: {
            featureEnabled: function () { return true; }
          }
        });
        expect(componentDef.options.length).toBe(4);
        expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining(_.extend({},
          FillConstants.Size.DEFAULT,
          {
            hidePanes: [FillConstants.Panes.BY_VALUE],
            help: 'editor.style.tooltips.fill.size'
          })
        ));
      });

      it('should add/remove properties when type is heatmap animation', function () {
        var componentDef = Dictionary['fillSize']({
          queryGeometryModel: this.queryGeometryModel,
          querySchemaModel: this.querySchemaModel,
          configModel: this.configModel,
          animationType: 'heatmap',
          styleType: StyleConstants.Type.ANIMATION,
          userModel: {
            featureEnabled: function () { return true; }
          }
        });
        expect(componentDef.options.length).toBe(1);
        expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining(_.extend({},
          FillConstants.Size.DEFAULT,
          {
            help: 'editor.style.tooltips.fill.size',
            hidePanes: [FillConstants.Panes.BY_VALUE]
          })
        ));
      });
    });

    it('should enable image/icons when geometry is point, style is simple and autoStyle is not applied', function () {
      this.queryGeometryModel.set('simple_geom', 'point');
      var componentDef = Dictionary['fillSize']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        isAutoStyleApplied: false,
        userModel: {
          featureEnabled: function () { return true; }
        }
      });

      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining(_.extend({},
        FillConstants.Size.DEFAULT,
        {
          defaultRange: FillConstants.Size.DEFAULT_RANGE,
          help: 'editor.style.tooltips.fill.size'
        }
      )
      ));
    });

    it('should not enable image/icons when geometry is point, style simple and autostyle is applied', function () {
      this.queryGeometryModel.set('simple_geom', 'point');
      var componentDef = Dictionary['fillSize']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        isAutoStyleApplied: true,
        userModel: {
          featureEnabled: function () { return true; }
        }
      });

      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining(_.extend({},
        FillConstants.Size.DEFAULT,
        {
          defaultRange: FillConstants.Size.DEFAULT_RANGE,
          help: 'editor.style.tooltips.fill.size'
        })
      ));
    });
  });

  describe('fillColor', function () {
    it('should generate the component definition', function () {
      var componentDef = Dictionary['fillColor']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: this.modals
      });
      expect(componentDef).toBeDefined();
      expect(componentDef.type).toBe('FillColor');
      expect(componentDef.options.length).toBe(4);
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        help: {
          color: 'editor.style.tooltips.fill.color',
          image: 'editor.style.tooltips.fill.image'
        },
        hidePanes: [],
        hideTabs: [],
        imageEnabled: true,
        categorizeColumns: false
      }));
    });

    it('should provide proper options with aggregation types', function () {
      checkAggregatedOptions({
        componentName: 'fillColor',
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: this.queryGeometryModel,
        configModel: this.configModel
      });
    });

    it('should have some changes when type is heatmap', function () {
      var componentDef = Dictionary['fillColor']({
        queryGeometryModel: this.queryGeometryModel,
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
        help: {
          color: 'editor.style.tooltips.fill.color-heatmap',
          image: null
        },
        hidePanes: ['fixed'],
        hideTabs: [],
        imageEnabled: false,
        categorizeColumns: false
      }));
    });

    describe('animated', function () {
      it('should be different when type is simple animation', function () {
        var componentDef = Dictionary['fillColor']({
          queryGeometryModel: this.queryGeometryModel,
          querySchemaModel: this.querySchemaModel,
          configModel: this.configModel,
          animationType: StyleConstants.Type.SIMPLE,
          styleType: StyleConstants.Type.ANIMATION
        });
        expect(componentDef.options.length).toBe(4);
        expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
          help: {
            color: 'editor.style.tooltips.fill.color',
            image: null
          },
          hidePanes: [],
          hideTabs: ['bins', 'quantification'],
          imageEnabled: false,
          categorizeColumns: true
        }));
      });

      it('should add/remove properties when type is heatmap animation', function () {
        var componentDef = Dictionary['fillColor']({
          queryGeometryModel: this.queryGeometryModel,
          querySchemaModel: this.querySchemaModel,
          configModel: this.configModel,
          animationType: 'heatmap',
          styleType: StyleConstants.Type.ANIMATION
        });
        expect(componentDef.options.length).toBe(1);
        expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
          help: {
            color: 'editor.style.tooltips.fill.color-heatmap',
            image: null
          },
          hidePanes: ['fixed'],
          hideTabs: ['bins', 'quantification'],
          imageEnabled: false,
          categorizeColumns: false
        }));
      });

      it('should hide numeric fields in any type, as torque is not compatible', function () {
        this.queryGeometryModel.set('simple_geom', 'point');
        var componentDef = Dictionary['fillColor']({
          queryGeometryModel: this.queryGeometryModel,
          querySchemaModel: this.querySchemaModel,
          configModel: this.configModel,
          animationType: "IT_DOESN'T_MATTER",
          styleType: StyleConstants.Type.ANIMATION, // <<
          isAutoStyleApplied: true
        });

        expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
          hideNumericColumns: true
        }));
      });
    });

    describe('polygon aggregations (squares, hexabins and regions)', function () {
      it('should not include "category" in color by-value options', function () {
        var types = [StyleConstants.Type.SQUARES, StyleConstants.Type.HEXABINS, StyleConstants.Type.REGIONS];
        var self = this;
        types.forEach(function (type) {
          var componentDef = Dictionary['fillColor']({
            queryGeometryModel: self.queryGeometryModel,
            querySchemaModel: self.querySchemaModel,
            configModel: self.configModel,
            styleType: type
          });
          expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
            removeByValueCategory: true
          }));
        });
      });
    });

    it('should enable image/icons when geometry is point, style is simple and autoStyle is not applied', function () {
      this.queryGeometryModel.set('simple_geom', 'point');
      var componentDef = Dictionary['fillColor']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        isAutoStyleApplied: false
      });

      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        help: {
          color: 'editor.style.tooltips.fill.color',
          image: 'editor.style.tooltips.fill.image'
        },
        hidePanes: [],
        hideTabs: [],
        hideNumericColumns: false,
        imageEnabled: true,
        categorizeColumns: false
      }));
    });

    it('should not enable image/icons when geometry is point, style simple and autostyle is applied', function () {
      this.queryGeometryModel.set('simple_geom', 'point');
      var componentDef = Dictionary['fillColor']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        isAutoStyleApplied: true
      });

      expect(componentDef.editorAttrs).toEqual({
        help: {
          color: 'editor.style.tooltips.fill.color',
          image: null
        },
        hidePanes: [],
        hideTabs: [],
        imageEnabled: false,
        hideNumericColumns: false,
        removeByValueCategory: false,
        geometryName: 'point',
        categorizeColumns: false
      });
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
        styleType: StyleConstants.Type.SIMPLE
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
  });

  describe('labels-fillSize', function () {
    var componentDef = Dictionary['labels-fillSize']({
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      configModel: this.configModel,
      styleType: StyleConstants.Type.SIMPLE,
      userModel: {
        featureEnabled: function () { return true; }
      },
      modals: this.modals
    });

    it('should generate the component definition', function () {
      expect(componentDef).toBeDefined();
      expect(componentDef.type).toBe('Size');
    });

    it('should hide by value pane', function () {
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        hidePanes: [FillConstants.Panes.BY_VALUE]
      }));
      expect(componentDef.fieldClass).toBe('Editor-formInner--NoTabs');
    });
  });

  describe('labels-fillColor', function () {
    var componentDef = Dictionary['labels-fillColor']({
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      configModel: this.configModel,
      styleType: StyleConstants.Type.SIMPLE,
      userModel: {
        featureEnabled: function () { return true; }
      },
      modals: this.modals
    });

    it('should generate the component definition', function () {
      expect(componentDef).toBeDefined();
      expect(componentDef.type).toBe('FillColor');
    });

    it('should hide by value pane and image', function () {
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        hidePanes: [FillConstants.Panes.BY_VALUE],
        imageEnabled: false
      }));
    });
  });

  describe('labels-haloSize', function () {
    var componentDef = Dictionary['labels-haloSize']({
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      configModel: this.configModel,
      styleType: StyleConstants.Type.SIMPLE,
      userModel: {
        featureEnabled: function () { return true; }
      },
      modals: this.modals
    });

    it('should generate the component definition', function () {
      expect(componentDef).toBeDefined();
      expect(componentDef.type).toBe('Size');
    });

    it('should hide by value pane', function () {
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        hidePanes: [FillConstants.Panes.BY_VALUE]
      }));
      expect(componentDef.fieldClass).toBe('Editor-formInner--NoTabs');
    });
  });

  describe('labels-haloColor', function () {
    it('should hide some panels', function () {
      var componentDef = Dictionary['labels-haloColor']({
        styleType: StyleConstants.Type.SIMPLE,
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: this.modals
      });

      expect(componentDef.type).toBe('FillColor');
      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        hidePanes: [FillConstants.Panes.BY_VALUE]
      }));
    });
  });

  describe('labels-placement', function () {
    it('should generate four options', function () {
      var componentDef = Dictionary['labels-placement']({
        styleType: StyleConstants.Type.SIMPLE
      });

      expect(componentDef.options.length).toBe(4);
      expect(componentDef.options[0].val).toBe('point');
      expect(componentDef.options[1].val).toBe('line');
      expect(componentDef.options[2].val).toBe('vertex');
      expect(componentDef.options[3].val).toBe('interior');
    });
  });

  describe('strokeSize', function () {
    it('should generate the proper definition for line geometry', function () {
      this.queryGeometryModel.set('simple_geom', 'line');

      var componentDef = Dictionary['strokeSize']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: this.modals
      });

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

      var componentDef = Dictionary['strokeSize']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: this.modals
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

      var componentDef = Dictionary['strokeSize']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: this.modals
      });

      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        min: 0,
        max: 10,
        step: 0.5,
        hidePanes: [FillConstants.Panes.BY_VALUE],
        help: 'editor.style.tooltips.stroke.size'
      }));
    });

    it('should generate the definition for polygon geometry', function () {
      this.queryGeometryModel.set('simple_geom', 'polygon');

      var componentDef = Dictionary['strokeSize']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: this.modals
      });

      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        min: 0,
        max: 10,
        step: 0.5,
        hidePanes: [FillConstants.Panes.BY_VALUE],
        help: 'editor.style.tooltips.stroke.size'
      }));
    });
  });

  describe('strokeColor', function () {
    it('should generate the definition for point geometry', function () {
      this.queryGeometryModel.set('simple_geom', 'point');

      var componentDef = Dictionary['strokeColor']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: this.modals
      });

      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        hidePanes: [ FillConstants.Panes.BY_VALUE ],
        help: 'editor.style.tooltips.stroke.color'
      }));
    });

    it('should generate the definition for polygon geometry', function () {
      this.queryGeometryModel.set('simple_geom', 'polygon');

      var componentDef = Dictionary['strokeColor']({
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel,
        configModel: this.configModel,
        styleType: StyleConstants.Type.SIMPLE,
        userModel: {
          featureEnabled: function () { return true; }
        },
        modals: this.modals
      });

      expect(componentDef.editorAttrs).toEqual(jasmine.objectContaining({
        hidePanes: [FillConstants.Panes.BY_VALUE],
        help: 'editor.style.tooltips.stroke.color'
      }));
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
