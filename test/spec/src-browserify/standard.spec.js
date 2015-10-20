var cartodb = require('../../../src-browserify/standard');

describe('standard bundle', function() {
  it('should set cartodb object in global namespace', function() {
    expect(window.cartodb).toBeDefined();
    expect(window.cdb).toBeDefined();
    expect(window.cartodb).toBe(cartodb);
    expect(window.cdb).toBe(window.cartodb);
  });

  it('should have jQuery in addition to the defaults', function() {
    expect(cartodb.$).toBeDefined();
    expect(window.$).toBeUndefined(); // …but not in global scope though
  });
});
