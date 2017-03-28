var Backbone = require('backbone');
var LegendsView = require('../../../../../src/geo/ui/legends/legends-view');
var TileLayer = require('../../../../../src/geo/map/tile-layer');
var CartoDBLayer = require('../../../../../src/geo/map/cartodb-layer');
var TorqueLayer = require('../../../../../src/geo/map/torque-layer');
var LayersCollection = require('../../../../../src/geo/map/layers');

describe('geo/ui/legends/legends-view', function () {
  beforeEach(function () {
    var vis = new Backbone.Model();
    vis.reload = jasmine.createSpy('reload');
    this.tileLayer = new TileLayer(null, { vis: {} });
    this.cartoDBLayer1 = new CartoDBLayer({ layer_name: 'CartoDB Layer #1', legends: [] }, { vis: vis });
    this.cartoDBLayer2 = new CartoDBLayer({ layer_name: 'CartoDB Layer #2', legends: [] }, { vis: vis });
    this.torqueLayer = new TorqueLayer({ layer_name: 'Torque Layer #3', legends: [] }, { vis: vis });

    this.layersCollection = new LayersCollection([]);
    this.layersCollection.reset([ this.tileLayer, this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);

    this.settingsModel = new Backbone.Model({
      showLegends: true,
      showLayerSelector: true,
      layerSelectorEnabled: true
    });

    this.legendsView = new LegendsView({
      layersCollection: this.layersCollection,
      settingsModel: this.settingsModel
    });

    this.legendsView.render();
  });

  var getLayerLegendTitles = function (legendsView) {
    var titleElements = legendsView.$('.CDB-LayerLegends > .CDB-Text').get();
    return titleElements.map(function (element) { return element.textContent.trim(); });
  };

  it('should render legends for CartoDB and torque layers', function () {
    expect(this.legendsView.$('.CDB-LayerLegends').length).toEqual(3);
    expect(getLayerLegendTitles(this.legendsView)).toEqual(['Torque Layer #3', 'CartoDB Layer #2', 'CartoDB Layer #1']);
  });

  it('should re-render when a layer with legends is removed from the collection of layers', function () {
    this.cartoDBLayer1.remove();

    expect(this.legendsView.$('.CDB-LayerLegends').length).toEqual(2);
    expect(getLayerLegendTitles(this.legendsView)).toEqual(['Torque Layer #3', 'CartoDB Layer #2']);
  });

  it('should re-render when new layers with legends are added to the collection of layers', function () {
    this.cartoDBLayer1.remove();
    this.layersCollection.add(this.cartoDBLayer1, { at: 1 });

    expect(this.legendsView.$('.CDB-LayerLegends').length).toEqual(3);
    expect(getLayerLegendTitles(this.legendsView)).toEqual(['Torque Layer #3', 'CartoDB Layer #2', 'CartoDB Layer #1']);
  });

  it('should show legends if showLegends is true', function () {
    this.settingsModel.set('showLegends', true);
    expect(this.legendsView.$('.Legends').length).toBe(3);
  });

  it('should hide legends if showLegends is false', function () {
    this.settingsModel.set('showLegends', false);
    expect(this.legendsView.$('.Legends').length).toBe(0);
  });

  it('should show layer selector if showLayerSelector is true', function () {
    this.settingsModel.set('showLayerSelector', true);
    expect(this.legendsView.$('input').length).toBe(3);
  });

  it('should hide layer selector if showLayerSelector is false', function () {
    this.settingsModel.set('showLayerSelector', false);
    expect(this.legendsView.$('input').length).toBe(0);
  });

  it('should hide element if showLayerSelector changes to false and no legends are visible', function () {
    spyOn(this.cartoDBLayer1.legends, 'hasAnyLegend').and.returnValue(false);
    spyOn(this.cartoDBLayer2.legends, 'hasAnyLegend').and.returnValue(false);
    expect(this.legendsView.el.style.display).toEqual('block');
    this.settingsModel.set('showLayerSelector', false);
    expect(this.legendsView.el.style.display).toEqual('none');
  });
});
