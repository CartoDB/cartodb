var cartodb = require('../../../src-browserify/standard');

describe('standard bundle', function() {
  it('should set cartodb object in global namespace', function() {
    expect(window.cartodb).toBeDefined();
    expect(window.cartodb).toBe(cartodb);
  });
});
