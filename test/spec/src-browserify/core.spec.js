var cartodb = require('../../../src-browserify/core');

describe('core bundle', function() {
  it('should set cartodb object in global namespace', function() {
    expect(window.cartodb).toBeDefined();
    expect(window.cartodb).toBe(cartodb);
  });

  it('should have expected objects on cartodb object', function() {
    expect(cartodb._Promise).toBeDefined();
    expect(cartodb.core).toBeDefined();
    expect(cartodb.core.Profiler).toBeDefined();
    expect(cartodb.core.util).toBeDefined();
    expect(cartodb.core.Loader).toBeDefined();

    expect(cartodb.vis).toBeDefined();
    expect(cartodb.vis.Loader).toBeDefined();

    expect(cartodb.Image).toBeDefined();

    expect(cartodb.SQL).toBeDefined();
    expect(cartodb.Tiles).toBeDefined();
  });

  it('should add more stuff to window object if not present', function() {
    expect(window._).toBeDefined();
    expect(window.Backbone).toBeDefined();
    expect(window.Backbone.Events).toBeDefined();
    expect(window.Backbone.Models).toBeUndefined(); // Verifies that it's the normal Backbone
    expect(window.JST).toBeDefined();
    expect(window.reqwest).toBeDefined();
    expect(window.vizjson).toBeDefined();
  });
});
