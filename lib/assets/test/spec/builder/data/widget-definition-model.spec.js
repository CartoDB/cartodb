var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');
var WidgetDefinitionsCollection = require('builder/data/widget-definitions-collection');
var configModel;

describe('builder/data/widget-definition-model', function () {
  beforeEach(function () {
    configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {},
      userModel: {}
    });

    this.collection = new WidgetDefinitionsCollection(null, {
      configModel: configModel,
      mapId: 'm-123',
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: new Backbone.Collection()
    });

    this.widgetDefModel = new WidgetDefinitionModel({
      id: 'w-456',
      title: 'some title',
      type: 'formula',
      layer_id: 'l-1',
      source: {
        id: 'a0'
      },
      options: {
        column: 'hello',
        operation: 'avg'
      }
    }, {
      parse: true,
      configModel: configModel,
      mapId: 'm-123',
      collection: this.collection
    });
  });

  it('should have a url pointing to layers API endpoint', function () {
    expect(this.widgetDefModel.url()).toEqual('/u/pepe/api/v3/maps/m-123/layers/l-1/widgets/w-456');

    // when no id:
    this.widgetDefModel.set('id', null);
    expect(this.widgetDefModel.url()).toEqual('/u/pepe/api/v3/maps/m-123/layers/l-1/widgets');
  });

  it('should flatten the structure on parse', function () {
    expect(this.widgetDefModel.attributes).toEqual(
      jasmine.objectContaining({
        id: 'w-456',
        title: 'some title',
        type: 'formula',
        layer_id: 'l-1',
        source: 'a0',
        column: 'hello',
        operation: 'avg',
        widget_style_definition: {
          color: {
            fixed: '#9DE0AD',
            opacity: 1
          }
        },
        widget_color_changed: false
      })
    );
  });

  it('should set some defaults in addition to the provided data', function () {
    expect(this.widgetDefModel.attributes).toEqual(
      jasmine.objectContaining({
        sync_on_bbox_change: true,
        auto_style_allowed: true
      })
    );
  });

  describe('.toJSON', function () {
    beforeEach(function () {
      this.d = this.widgetDefModel.toJSON();
    });

    it('should include expected attrs', function () {
      expect(this.d).toEqual({
        id: 'w-456',
        type: 'formula',
        title: 'some title',
        layer_id: 'l-1',
        source: {
          id: 'a0'
        },
        style: {
          widget_style: {
            definition: {
              color: {
                fixed: '#9DE0AD',
                opacity: 1
              }
            },
            widget_color_changed: false
          },
          auto_style: {
            custom: false,
            allowed: true
          }
        },
        options: {
          column: 'hello',
          operation: 'avg',
          sync_on_bbox_change: true
        }
      });
    });
  });

  describe('.changeType', function () {
    beforeEach(function () {
      this.widgetDefModel.changeType('category');
    });

    it('should keep some attrs', function () {
      expect(this.widgetDefModel.id).toEqual('w-456');
      expect(this.widgetDefModel.get('id')).toEqual('w-456');
      expect(this.widgetDefModel.get('layer_id')).toEqual('l-1');
      expect(this.widgetDefModel.get('sync_on_bbox_change')).toBe(true);
      expect(this.widgetDefModel.get('auto_style_allowed')).toBe(true);
      expect(this.widgetDefModel.get('title')).toEqual('some title');
      expect(this.widgetDefModel.get('widget_style_definition')).toEqual({
        color: {
          fixed: '#9DE0AD',
          opacity: 1
        }
      });
    });

    it('should have new relevant attrs', function () {
      expect(this.widgetDefModel.get('type')).toEqual('category');
      expect(this.widgetDefModel.get('column')).toEqual('hello');
      expect(this.widgetDefModel.get('aggregation')).toEqual('count');
      expect(this.widgetDefModel.get('aggregation_column')).toEqual('hello');
    });

    it('should remove attrs of no interest anymore', function () {
      expect(this.widgetDefModel.get('operation')).toBeUndefined();
    });
  });

  describe('.containsNode', function () {
    beforeEach(function () {
      this.analysisDefinitionNodesCollection.add([
        {
          id: 'a1',
          type: 'buffer',
          params: {
            radius: 100,
            source: {
              id: 'a0',
              type: 'source',
              params: {
                query: 'SELECT * FROM something'
              }
            }
          }
        }, {
          id: 'b0',
          type: 'source',
          params: {
            query: 'SELECT * FROM other'
          }
        }
      ]);
      this.a1 = this.analysisDefinitionNodesCollection.get('a1');
      this.a0 = this.analysisDefinitionNodesCollection.get('a0');
      this.widgetDefModel.set('source', 'a1');
    });

    it('should return true if widget depends on given node', function () {
      expect(this.widgetDefModel.containsNode(this.a1)).toBe(true);
      expect(this.widgetDefModel.containsNode(this.a0)).toBe(true);

      expect(this.widgetDefModel.containsNode(this.b0)).toBe(false);
      expect(this.widgetDefModel.containsNode()).toBe(false);
      expect(this.widgetDefModel.containsNode(false)).toBe(false);
    });

    it('should return false if widget source does not exist', function () {
      this.widgetDefModel.set('source', 'y404');
      expect(this.widgetDefModel.containsNode(this.a1)).toBe(false);
    });
  });
});
