var cartodb = require('../../../src-browserify/standard');

describe('standard bundle', function() {
  it('should set cartodb object in global namespace', function() {
    expect(window.cartodb).toBeDefined();
    expect(window.cartodb).toBe(cartodb);
  });

  it('should have the commonly used libs set on the object', function() {
    expect(cartodb.$).toBeDefined();
    expect(cartodb.L).toBeDefined();
    expect(cartodb.Mustache).toBeDefined();
    expect(cartodb.Backbone).toBeDefined();
    expect(cartodb._).toBeDefined();
  });

  it('should not expose some vendor libs in the global namespace', function() {
    expect(window.$).toBeUndefined();
    expect(window.Mustache).toBeUndefined();
    expect(window.Backbone).toBeUndefined();
    expect(window._).toBeUndefined();
    expect(window.L).toBeUndefined();
  });
});
