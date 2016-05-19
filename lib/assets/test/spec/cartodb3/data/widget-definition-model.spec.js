var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data/widget-definition-model');
var WidgetDefinitionsCollection = require('../../../../javascripts/cartodb3/data/widget-definitions-collection');

describe('data/widget-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.collection = new WidgetDefinitionsCollection(null, {
      configModel: configModel,
      mapId: 'm-123',
      analysisDefinitionNodesCollection: new Backbone.Collection(),
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
    expect(this.widgetDefModel.get('column')).toEqual('hello');
  });

  it('should set some defaults', function () {
    expect(this.widgetDefModel.get('sync_on_data_change')).toBe(true);
    expect(this.widgetDefModel.get('sync_on_bbox_change')).toBe(true);
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
        options: {
          column: 'hello',
          operation: 'avg',
          sync_on_data_change: true,
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
      expect(this.widgetDefModel.get('sync_on_data_change')).toBe(true);
      expect(this.widgetDefModel.get('sync_on_bbox_change')).toBe(true);
      expect(this.widgetDefModel.get('title')).toEqual('some title');
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
});
