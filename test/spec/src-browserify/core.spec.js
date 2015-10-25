var cartodb = require('../../../src-browserify/core');

describe('core bundle', function() {
  it('should set cartodb object in global namespace', function() {
    expect(window.cartodb).toEqual(jasmine.any(Object));
    expect(window.cartodb).toBe(cartodb);
  });

  it('should have expected objects on cartodb object', function() {
    expect(cartodb.core).toEqual(jasmine.any(Object));
    expect(cartodb.vis).toEqual(jasmine.any(Object));

    expect(cartodb.vis.Loader).toEqual(jasmine.any(Object));
    expect(cartodb.core.Loader).toBe(cartodb.vis.Loader);
    expect(cartodb.core.Profiler).toEqual(jasmine.any(Function));
    expect(cartodb.core.util).toEqual(jasmine.any(Object));

    expect(cartodb.Image).toEqual(jasmine.any(Function));
    expect(cartodb.SQL).toEqual(jasmine.any(Function));
    expect(cartodb.Tiles).toEqual(jasmine.any(Function));
    expect(cartodb._Promise).toBeDefined();

    expect(cartodb.VERSION).toEqual(jasmine.any(String));
    expect(cartodb.DEBUG).toEqual(jasmine.any(Boolean));
    expect(cartodb.CARTOCSS_VERSIONS).toEqual(jasmine.any(Object));
    expect(cartodb.CARTOCSS_DEFAULT_VERSION).toEqual(jasmine.any(String));
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
