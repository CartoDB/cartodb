var createCdb = require('../../../src-browserify/create-cdb');

describe('create-cdb', function() {
  beforeEach(function() {
    this.cdb = createCdb();
  });

  it('should have the commonly used vendor libs defined', function() {
    expect(this.cdb.L).toBeDefined();
    expect(this.cdb.Mustache).toBeDefined();
    expect(this.cdb.Backbone).toBeDefined();
    expect(this.cdb._).toBeDefined();
  });

  it('should not load jQuery by default', function() {
    expect(this.cdb.$).toBeUndefined();
  });

  it('should not expose some vendor libs defined in the global namespace', function() {
    expect(window.$).toBeUndefined();
    expect(window.Mustache).toBeUndefined();
    expect(window.Backbone).toBeUndefined();
    expect(window._).toBeUndefined();
    expect(window.L).toBeUndefined();
  });

  describe('cdb.config', function() {
    it('should contain links variables', function() {
      expect(this.cdb.config.get('cartodb_attributions')).toEqual("CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>");
      expect(this.cdb.config.get('cartodb_logo_link')).toEqual("http://www.cartodb.com");
    });
  });
});
