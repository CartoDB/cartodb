var cdb = require('../../../src-browserify/standard');
var sharedForCdb = require('./shared-for-cdb');
var sharedForCdbNonCore = require('./shared-for-cdb-non-core');

describe('standard bundle', function() {
  sharedForCdb(cdb);
  sharedForCdbNonCore(cdb);

  it('should set cartodb object in global namespace', function() {
    expect(cdb).toEqual(jasmine.any(Object));
  });

  it('should have leaflet set', function() {
    expect(cdb.L).toEqual(jasmine.any(Object));
  });

  it('should have jQuery in addition to the defaults', function() {
    expect(cartodb.$).toBeDefined();
    expect(window.$).toBeUndefined(); // …but not in global scope though
  });
});
