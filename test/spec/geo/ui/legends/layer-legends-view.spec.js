var $ = require('jquery');
var Backbone = require('backbone');
var LayerLegendsView = require('../../../../../src/geo/ui/legends/layer-legends-view');
var CartoDBLayer = require('../../../../../src/geo/map/cartodb-layer');

describe('geo/ui/legends/layer-legends-view', function () {
  beforeEach(function () {
    var vis = new Backbone.Model();
    vis.reload = jasmine.createSpy('reload');

    this.settingsModel = new Backbone.Model({
      showLegends: true,
      showLayerSelector: true,
      layerSelectorEnabled: true
    });

    this.cartoDBLayer = new CartoDBLayer({
      layer_name: 'CartoDB Layer #1',
      legends: [
        { type: 'bubble', title: 'Bubble Legend' },
        { type: 'category', title: 'Category Legend' }
      ]
    }, { vis: vis });

    this.tryContainerVisibility = jasmine.createSpy('tryContainerVisibility');

    this.layerLegendsView = new LayerLegendsView({
      model: this.cartoDBLayer,
      settingsModel: this.settingsModel,
      tryContainerVisibility: this.tryContainerVisibility
    });

    this.layerLegendsView.render();

    $('body').append(this.layerLegendsView.$el);
  });

  afterEach(function () {
    this.layerLegendsView.$el.remove();
  });

  it('should render all legends', function () {
    // Legends of all types have been rendered
    expect(this.layerLegendsView.$('.CDB-Legend-item').length).toEqual(5);
  });

  it('should trigger a "render" event when the view is rendered', function () {
    var callback = jasmine.createSpy('callback');
    this.layerLegendsView.on('render', callback);

    this.layerLegendsView.render();

    expect(callback).toHaveBeenCalled();
  });

  it('should update the name of the layer when it changes', function () {
    expect(this.layerLegendsView.$el.html()).toMatch('CartoDB Layer #1');

    this.cartoDBLayer.set('layer_name', 'A NEW layer name');

    expect(this.layerLegendsView.$el.html()).not.toMatch('CartoDB Layer #1');
    expect(this.layerLegendsView.$el.html()).toMatch('A NEW layer name');
  });

  it('should hide/show the layer if check next to title is clicked', function () {
    expect(this.cartoDBLayer.isVisible()).toBeTruthy();

    this.layerLegendsView.$('.js-toggle-layer').trigger('click');

    expect(this.cartoDBLayer.isVisible()).toBeFalsy();

    this.layerLegendsView.$('.js-toggle-layer').trigger('click');

    expect(this.cartoDBLayer.isVisible()).toBeTruthy();
  });

  it('should uncheck/check the check if layer is hidden/shown', function () {
    expect(this.layerLegendsView.$('.js-toggle-layer').is(':checked')).toBe(true);

    this.cartoDBLayer.hide();

    expect(this.layerLegendsView.$('.js-toggle-layer').is(':checked')).toBe(false);

    this.cartoDBLayer.show();

    expect(this.layerLegendsView.$('.js-toggle-layer').is(':checked')).toBe(true);
  });

  it('should hide/show legend views when layer is hidden/shown', function () {
    this.cartoDBLayer.hide();
    expect(this.layerLegendsView.$('.js-legends').length).toBe(0);

    this.cartoDBLayer.show();
    expect(this.layerLegendsView.$('.js-legends').length).toBe(1);
  });

  it('should be hidden if no legends are rendered', function () {
    spyOn(this.cartoDBLayer.legends, 'hasAnyLegend').and.returnValue(false);
    this.settingsModel.set('showLayerSelector', false);
    this.layerLegendsView.render();
    expect(this.layerLegendsView.$el.is(':empty')).toBe(true);
  });

  it('should not render layer selector checkbox if not embed', function () {
    this.settingsModel.set('layerSelectorEnabled', false);
    this.layerLegendsView.render();
    expect(this.layerLegendsView.$('.js-toggle-layer').length).toBe(0);
  });
});
