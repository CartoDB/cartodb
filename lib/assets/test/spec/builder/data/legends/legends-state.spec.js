var Backbone = require('backbone');
var LegendsState = require('builder/data/legends/legends-state');

describe('data/legends/legends-state', function () {
  beforeAll(function () {
    this.layerDefinitionModel = new Backbone.Model({
      id: 'l-1'
    });

    this.layerDefinitionsCollection = new Backbone.Collection();
    this.layerDefinitionsCollection.add(this.layerDefinitionModel);

    this.legendDefinitionsCollection = new Backbone.Collection();

    var legendModel = new Backbone.Model({
      type: 'choropleth',
      title: 'foo',
      conf: {
        columns: ['title']
      }
    });

    legendModel.layerDefinitionModel = this.layerDefinitionModel;

    this.legendDefinitionsCollection.add(legendModel);

    LegendsState.init(this.layerDefinitionsCollection, this.legendDefinitionsCollection);
  });

  it('should be populated properly', function () {
    var instance = LegendsState.getInstance();

    expect(instance['l-1']).toBeDefined();
    expect(instance['l-1']['color']).toBeDefined();
    expect(instance['l-1']['color']['title']).toBe('foo');
    expect(instance['l-1']['size']).toBeUndefined();
  });

  describe('get', function () {
    it('should return existing state properly', function () {
      var state = LegendsState.get(this.layerDefinitionModel, 'choropleth');
      expect(state.title).toBeDefined();
      expect(state.title).toBe('foo');
    });

    it('should return undefined for non existint state', function () {
      var state = LegendsState.get(this.layerDefinitionModel, 'bubble');
      expect(state).toBeUndefined();
    });
  });

  describe('set', function () {
    it('should set properly', function () {
      LegendsState.set(this.layerDefinitionModel, 'bubble', {title: 'bar'});
      var instance = LegendsState.getInstance();

      expect(instance['l-1']['size']).toBeDefined();
      expect(instance['l-1']['size']['title']).toBe('bar');
    });

    it('should set properly for new layers', function () {
      LegendsState.set(new Backbone.Model({id: 'l-2'}), 'custom', {title: 'pop'});
      var instance = LegendsState.getInstance();

      expect(instance['l-2']['color']).toBeDefined();
      expect(instance['l-2']['color']['title']).toBe('pop');
    });
  });

  describe('events', function () {
    it('add layer', function () {
      var layer = new Backbone.Model({id: 'l-200'});
      this.layerDefinitionsCollection.add(layer);
      var instance = LegendsState.getInstance();
      expect(instance['l-200']).toBeDefined();
    });

    it('remove layer', function () {
      var layer = this.layerDefinitionsCollection.at(0);
      this.layerDefinitionsCollection.remove(layer);

      var instance = LegendsState.getInstance();
      expect(instance['l-1']).toBeUndefined();
    });
  });
});
