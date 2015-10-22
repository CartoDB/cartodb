var cdb = require('../../../src-browserify/standard');
var sharedForCdb = require('./shared-for-cdb');

describe('standard bundle', function() {
  sharedForCdb();

  it('should set cartodb object in global namespace', function() {
    expect(cdb).toEqual(jasmine.any(Object));
    expect(cdb).toBe(window.cdb);
    expect(cdb).toBe(window.cartodb);
  });

  it('should have jQuery in addition to the defaults', function() {
    expect(cartodb.$).toBeDefined();
    expect(window.$).toBeUndefined(); // …but not in global scope though
  });
});
