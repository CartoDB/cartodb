var $ = require('jquery');
var createCdb = require('../../../src-browserify/create-cdb');

describe('create-cdb', function() {
  beforeEach(function() {
    this.cdb = createCdb({
      jQuery: $
    });
    window.cartodb = this.cdb; // simulate a real bundle, necessary for some specs to pass
  });

  describe('when jQuery is provided in global scope instead directly', function() {
    beforeEach(function() {
      window.$ = $;
      this.cdb = createCdb();
    });

    it('should not provide jQuery through the returned object', function() {
      expect(this.cdb.$).toBeUndefined();
    });
  });

  it('should have the commonly used vendor libs defined', function() {
    expect(this.cdb.L).toBeDefined();
    expect(this.cdb.Mustache).toBeDefined();
    expect(this.cdb.Backbone).toBeDefined();
    expect(this.cdb._).toBeDefined();
  });

  it("should create a cdb.Profiler", function() {
    expect(this.cdb.config).toBeDefined();
  });

  it("should create a cdb.Profiler", function() {
    expect(this.cdb.Profiler).toBeDefined();
  });

  it("should create a cdb.decorators", function() {
    expect(this.cdb.decorators).toBeDefined();
  });

  it("should create a log", function() {
    expect(this.cdb.log).toBeDefined();
  });

  it("should generate error when error is called", function() {
    this.cdb.config.ERROR_TRACK_ENABLED = true
    this.cdb.errors.reset([]);
    this.cdb.log.error('this is an error');
    expect(this.cdb.errors.size()).toEqual(1);
  });

  it("should create a global error list", function() {
    expect(this.cdb.errors).toBeDefined();
  });

  it('should not expose some vendor libs defined in the global namespace', function() {
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

  it('should expose a Profiler class', function() {
    expect(this.cdb.Profiler).toBeDefined();
  });

  it('should add templates stuff', function() {
    expect(this.cdb.core.Template).toBeDefined();
    expect(this.cdb.core.TemplateList).toBeDefined();
    expect(this.cdb.templates instanceof this.cdb.core.TemplateList).toBe(true);
  });

  it('should have a core.Model', function() {
    expect(this.cdb.core.Model).toBeDefined();
  });

  it('should have a core.View', function() {
    expect(this.cdb.core.View).toBeDefined();
  });

  it('should have a core.vis', function() {
    expect(this.cdb.vis).toBeDefined();
  });

  it('should have a core.vis.Loader', function() {
    expect(this.cdb.vis.Loader).toBeDefined();
  });

  it('should have a core.core.Loader', function() {
    expect(this.cdb.core.Loader).toBeDefined();
  });

  it('should have a core.util', function() {
    expect(this.cdb.core.util).toBeDefined();
  });
});
