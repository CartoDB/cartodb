var cdb = require('../../../src-browserify/core');
var sharedForCdb = require('./shared-for-cdb');

describe('core bundle', function() {
  sharedForCdb(cdb);

  it('should have some objects present on the cdb object', function() {
    expect(cdb.Tiles).toEqual(jasmine.any(Function));
    expect(cdb._Promise).toEqual(jasmine.any(Function));
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
