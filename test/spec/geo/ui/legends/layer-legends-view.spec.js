var $ = require('jquery');
var Backbone = require('backbone');
var LayerLegendsView = require('../../../../../src/geo/ui/legends/layer-legends-view');
var CartoDBLayer = require('../../../../../src/geo/map/cartodb-layer');

describe('geo/ui/legends/layer-legends-view', function () {
  beforeEach(function () {
    var vis = new Backbone.Model();
    vis.reload = jasmine.createSpy('reload');

    this.cartoDBLayer = new CartoDBLayer({
      layer_name: 'CartoDB Layer #1',
      legends: [
        { type: 'bubble', title: 'Bubble Legend' },
        { type: 'category', title: 'Category Legend' }
      ]
    }, { vis: vis });

    this.layerLegendsView = new LayerLegendsView({
      model: this.cartoDBLayer
    });

    this.layerLegendsView.render();
    this.toggleLayerCheck = this.layerLegendsView.$('.js-toggle-layer');

    $('body').append(this.layerLegendsView.$el);
  });

  afterEach(function () {
    this.layerLegendsView.$el.remove();
  });

  it('should render all legends', function () {
    // Legends of all types have been rendered
    expect(this.layerLegendsView.$('.CDB-Legend-item').length).toEqual(5);
  });

  it('should update the name of the layer when it changes', function () {
    expect(this.layerLegendsView.$el.html()).toMatch('CartoDB Layer #1');

    this.cartoDBLayer.set('layer_name', 'A NEW layer name');

    expect(this.layerLegendsView.$el.html()).not.toMatch('CartoDB Layer #1');
    expect(this.layerLegendsView.$el.html()).toMatch('A NEW layer name');
  });

  it('should hide/show the layer if check next to title is clicked', function () {
    expect(this.cartoDBLayer.isVisible()).toBeTruthy();

    this.toggleLayerCheck.trigger('click');

    expect(this.cartoDBLayer.isVisible()).toBeFalsy();

    this.toggleLayerCheck.trigger('click');

    expect(this.cartoDBLayer.isVisible()).toBeTruthy();
  });

  it('should uncheck/check the check if layer is hidden/shown', function () {
    expect(this.toggleLayerCheck.is(':checked')).toBe(true);

    this.cartoDBLayer.hide();

    expect(this.toggleLayerCheck.is(':checked')).toBe(false);

    this.cartoDBLayer.show();

    expect(this.toggleLayerCheck.is(':checked')).toBe(true);
  });

  it('should disable/enable itself and legend views when layer is hidden/shown', function () {
    expect(this.layerLegendsView.$el.hasClass('is-disabled')).toBeFalsy();
    expect(this.layerLegendsView.$('.is-disabled').length).toEqual(0);

    this.cartoDBLayer.hide();

    // View is disabled
    expect(this.layerLegendsView.$el.hasClass('is-disabled')).toBeTruthy();
    // Legend views are also disabled
    expect(this.layerLegendsView.$('.is-disabled').length).toEqual(5);

    this.cartoDBLayer.show();

    expect(this.layerLegendsView.$el.hasClass('is-disabled')).toBeFalsy();
    expect(this.layerLegendsView.$('.is-disabled').length).toEqual(0);
  });
});
