var _ = require('underscore');
var Backbone = require('backbone');
var LegendDefinitionsCollection = require('builder/data/legends/legend-definitions-collection');
var LegendsState = require('builder/data/legends/legends-state');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var LegendFactory = require('builder/editor/layers/layer-content-views/legend/legend-factory');
var ConfigModel = require('builder/data/config-model');
var Validations = require('builder/editor/layers/layer-content-views/legend/legend-validations');

function getSuccessResponse (id, type, title) {
  var success = _.clone(TestResponses.save.success);
  success.responseText = _.template(success.responseText)({
    id: id,
    type: type,
    title: title || ''
  });

  return success;
}

var TestResponses = {
  save: {
    success: {
      'status': '200',
      'content-type': 'application/json',
      responseText: '{"created_at":"2016-09-30T07:57:15+00:00","id":"<%= id %>","layer_id":"l-1","title":"<%= title %>","type":"<%= type %>","definition": {"color":"#fabada", "prefix":"", "suffix": "" }}'
    }
  },
  destroy: {
    success: {
      status: 204
    }
  }
};

describe('editor/layers/layer-content-view/legend/legend-factory', function () {
  beforeEach(function () {
    jasmine.Ajax.install();

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      fetched: true,
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      }
    }, {
      parse: true,
      configModel: this.configModel
    });

    var styleModel = new Backbone.Model({
      fill: {
        color: {
          fixed: '#fabada'
        }
      }
    });

    this.layerDefinitionModel.styleModel = styleModel;

    this.layerDefinitionsCollection = new Backbone.Collection();
    this.layerDefinitionsCollection.add(this.layerDefinitionModel);

    this.legendDefinitionsCollection = new LegendDefinitionsCollection([], {
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      configModel: this.configModel,
      vizId: 'v-123'
    });

    LegendsState.init(this.layerDefinitionsCollection, this.legendDefinitionsCollection);

    spyOn(Validations, 'bubble').and.returnValue(true);
    spyOn(Validations, 'choropleth').and.returnValue(true);
    spyOn(Validations, 'category').and.returnValue(true);

    LegendFactory.init(this.legendDefinitionsCollection);
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('create legend', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(1, 'bubble'));

    LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(2, 'choropleth'));

    expect(this.legendDefinitionsCollection.length).toBe(2);
    expect(this.legendDefinitionsCollection.at(0).get('type')).toBe('bubble');
    expect(this.legendDefinitionsCollection.at(1).get('type')).toBe('choropleth');
  });

  it('update doesn\'t send two requests for the same attribute types', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'category');
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(2, 'category'));

    LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
    jasmine.Ajax.requests.mostRecent().respondWith(TestResponses.destroy.success);
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(2, 'choropleth'));

    LegendFactory.createLegend(this.layerDefinitionModel, 'custom');
    jasmine.Ajax.requests.mostRecent().respondWith(TestResponses.destroy.success);
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(2, 'custom'));

    expect(this.legendDefinitionsCollection.length).toBe(1);
    expect(this.legendDefinitionsCollection.at(0).get('type')).toBe('custom');
  });

  it('update an existent legend', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble', {title: 'foo'});
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(1, 'bubble'));

    var model = this.legendDefinitionsCollection.findByLayerDefModelAndType(this.layerDefinitionModel, 'bubble');
    spyOn(model, 'set').and.callThrough();

    model.setAttributes({title: 'fiu'});
    model.set.calls.reset();

    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble', {title: 'bar'});
    expect(model.set).toHaveBeenCalledWith({title: 'bar'});
    expect(model.get('title')).toEqual('fiu');
    expect(model.get('customState')).toEqual(['title']);

    // Mimic the remove the title action by the UI form
    model.setAttributes({title: 'foo'});

    model.set.calls.reset();
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble', {title: 'bar'});
    expect(model.set).toHaveBeenCalledWith({title: 'bar'});
    expect(model.get('title')).toEqual('foo');
    expect(model.get('customState')).toEqual(['title']);
  });

  it('remove legend', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(1, 'bubble'));

    LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(2, 'choropleth'));

    LegendFactory.removeLegend(this.layerDefinitionModel, 'bubble');
    jasmine.Ajax.requests.mostRecent().respondWith(TestResponses.destroy.success);

    expect(this.legendDefinitionsCollection.length).toBe(1);
    expect(this.legendDefinitionsCollection.at(0).get('type')).toBe('choropleth');
  });

  it('remove all legends', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(1, 'bubble'));

    LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(2, 'choropleth'));

    LegendFactory.createLegend(this.layerDefinitionModel, 'category');
    jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse(3, 'category'));

    LegendFactory.removeAllLegend(this.layerDefinitionModel);
    expect(this.legendDefinitionsCollection.length).toBe(0);
  });
});
