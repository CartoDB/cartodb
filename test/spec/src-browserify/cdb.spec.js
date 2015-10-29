var $ = require('jquery-proxy').set(require('jquery')).get();
var cdb = require('../../../src-browserify/cdb');

describe('cdb', function() {
  it('should have the commonly used vendor libs defined', function() {
    expect(cdb.$).toEqual(jasmine.any(Function));
    expect(cdb.L).toEqual(jasmine.any(Object));
    expect(cdb.Mustache).toEqual(jasmine.any(Object));
    expect(cdb.Backbone).toEqual(jasmine.any(Object));
    expect(cdb._).toEqual(jasmine.any(Object));
  });

  it("should create a cdb.Profiler", function() {
    expect(cdb.config).toBeDefined();
  });

  it("should create a cdb.Profiler", function() {
    expect(cdb.Profiler).toBeDefined();
  });

  it("should create a cdb.decorators", function() {
    expect(cdb.decorators).toBeDefined();
  });

  it("should create a log", function() {
    expect(cdb.log).toBeDefined();
  });

  it("should generate error when error is called", function() {
    cdb.config.ERROR_TRACK_ENABLED = true
    cdb.errors.reset([]);
    cdb.log.error('this is an error');
    expect(cdb.errors.size()).toEqual(1);
  });

  it("should create a global error list", function() {
    expect(cdb.errors).toBeDefined();
  });

  it('should not expose some vendor libs defined in the global namespace', function() {
    expect(window.Mustache).toBeUndefined();
    expect(window.Backbone).toBeUndefined();
    expect(window._).toBeUndefined();
    expect(window.L).toBeUndefined();
  });

  describe('cdb.config', function() {
    it('should contain links variables', function() {
      expect(cdb.config.get('cartodb_attributions')).toEqual("CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>");
      expect(cdb.config.get('cartodb_logo_link')).toEqual("http://www.cartodb.com");
    });
  });

  it('should expose a Profiler class', function() {
    expect(cdb.Profiler).toBeDefined();
  });

  it('should add templates stuff', function() {
    expect(cdb.core.Template).toBeDefined();
    expect(cdb.core.TemplateList).toBeDefined();
    expect(cdb.templates instanceof cdb.core.TemplateList).toBe(true);
  });

  it('should have a core.Model', function() {
    expect(cdb.core.Model).toBeDefined();
  });

  it('should have a core.View', function() {
    expect(cdb.core.View).toBeDefined();
  });

  it('should have a core.vis', function() {
    expect(cdb.vis).toBeDefined();
  });

  it('should have a core.vis.Loader', function() {
    expect(cdb.vis.Loader).toBeDefined();
  });

  it('should have a core.core.Loader', function() {
    expect(cdb.core.Loader).toBeDefined();
  });

  it('should have a core.util', function() {
    expect(cdb.core.util).toBeDefined();
  });
});
