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
    this.tileLayer = new TileLayer();
    this.cartoDBLayer1 = new CartoDBLayer({ layer_name: 'CartoDB Layer #1', legends: [] }, { vis: vis });
    this.cartoDBLayer2 = new CartoDBLayer({ layer_name: 'CartoDB Layer #2', legends: [] }, { vis: vis });
    this.torqueLayer = new TorqueLayer({ layer_name: 'Torque Layer #3', legends: [] }, { vis: vis });

    this.layersCollection = new LayersCollection([]);
    this.layersCollection.reset([ this.tileLayer, this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);

    this.legendsView = new LegendsView({
      layersCollection: this.layersCollection,
      showLegends: true,
      showLayerSelector: true
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
    this.legendsView.renderModel.set('legends', true);
    expect(this.legendsView.$('.Legends').css('display')).toEqual('');
  });

  it('should hide legends if showLegends is false', function () {
    this.legendsView.renderModel.set('legends', false);
    expect(this.legendsView.$('.Legends').css('display')).toEqual('none');
  });

  it('should show/hide legends when showLegends changes', function () {
    this.legendsView.renderModel.set('legends', false);
    expect(this.legendsView.$('.Legends').css('display')).toEqual('none');
    this.legendsView.renderModel.set('legends', true);
    expect(this.legendsView.$('.Legends').css('display')).toEqual('block');
  });
});
