var _ = require('underscore');
var Backbone = require('backbone');
var LegendDefinitionsCollection = require('../../../../../../../javascripts/cartodb3/data/legends/legend-definitions-collection');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var LegendFactory = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legend-factory');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');

var TestResponses = {
  save: {
    success: {
      'status': '200',
      'content-type': 'application/json',
      'responseText': _.template('{"created_at":"2016-09-30T07:57:15+00:00","id":"<%= id %>","layer_id":"l-1","title":"","type":"<%= type %>","definition": {"color":"#fabada", "prefix":"", "suffix": "" }}')
    }
  },
  destroy: {
    success: {
      status: 204
    }
  }
};

fdescribe('editor/layers/layer-content-view/legend/legend-factory', function () {

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

    this.layerDefinitionsCollection = new Backbone.Collection();
    this.layerDefinitionsCollection.add(this.layerDefinitionModel);

    this.legendDefinitionsCollection = new LegendDefinitionsCollection([], {
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      configModel: this.configModel,
      vizId: 'v-123'
    });

    // We are supposing that the save action in the server is going well after all
    // spyOn(LegendFactory, 'add').and.callFake(function (model) {
    //   this.legendDefinitionsCollection.add(model);
    // });

    // // Valid for destroy action as well
    // spyOn(LegendFactory, 'remove').and.callFake(function (model) {
    //   this.legendDefinitionsCollection.remove(model);
    // });

    LegendFactory.init(this.legendDefinitionsCollection);
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('create legend', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
    jasmine.Ajax.requests.mostRecent().respondWith(TestResponses.save.success({
      type: 'bubble',
      id: 1
    }));

    LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
    jasmine.Ajax.requests.mostRecent().respondWith(TestResponses.save.success({
      type: 'choropleth',
      id: 2
    }));

    LegendFactory.createLegend(this.layerDefinitionModel, 'category');
    jasmine.Ajax.requests.mostRecent().respondWith(TestResponses.save.success({
      type: 'category',
      id: 3
    }));

    expect(this.legendDefinitionsCollection.length).toBe(3);
    expect(this.legendDefinitionsCollection.at(0).get('type')).toBe('bubble');
    expect(this.legendDefinitionsCollection.at(1).get('type')).toBe('choropleth');
    expect(this.legendDefinitionsCollection.at(2).get('type')).toBe('category');
  });

  it('remove legend', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
    jasmine.Ajax.requests.mostRecent().respondWith(TestResponses.save.success({
      type: 'bubble',
      id: 1
    }));

    LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
    jasmine.Ajax.requests.mostRecent().respondWith(TestResponses.save.success({
      type: 'choropleth',
      id: 2
    }));

    LegendFactory.createLegend(this.layerDefinitionModel, 'category');
    jasmine.Ajax.requests.mostRecent().respondWith(TestResponses.save.success({
      type: 'category',
      id: 3
    }));

    LegendFactory.removeLegend(this.layerDefinitionModel, 'bubble');
    jasmine.Ajax.requests.mostRecent().respondWith(TestResponses.destroy.success);

    expect(this.legendDefinitionsCollection.length).toBe(2);
    expect(this.legendDefinitionsCollection.at(0).get('type')).toBe('choropleth');
    expect(this.legendDefinitionsCollection.at(1).get('type')).toBe('category');
  });

  it('remove all legends', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
    LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
    LegendFactory.createLegend(this.layerDefinitionModel, 'category');

    LegendFactory.removeAllLegend(this.layerDefinitionModel);
    expect(this.legendDefinitionsCollection.length).toBe(0);
  });
});
