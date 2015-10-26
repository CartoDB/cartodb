module.exports = function(cdb) {
  describe('shared for cdb object in all bundles', function() {
    it('should set cartodb object in global namespace', function() {
      expect(window.cdb).toEqual(jasmine.any(Object));
      expect(window.cdb).toBe(cdb);
      expect(cdb).toBe(window.cartodb);
      expect(window.cartodb).toBe(cartodb);
    });

    it('should have common object placeholders', function() {
      expect(cdb.core).toEqual(jasmine.any(Object));
      expect(cdb.vis).toEqual(jasmine.any(Object));

      expect(cdb.geo).toEqual(jasmine.any(Object));
      expect(cdb.geo.ui).toEqual(jasmine.any(Object));
      expect(cdb.geo.geocoder).toEqual(jasmine.any(Object));

      expect(cdb.ui).toEqual(jasmine.any(Object));
      expect(cdb.ui.common).toEqual(jasmine.any(Object));
    });

    it('should have expected objects on cdb object', function() {
      expect(cdb.core).toEqual(jasmine.any(Object));
      expect(cdb.vis).toEqual(jasmine.any(Object));

      expect(cdb.vis.Loader).toEqual(jasmine.any(Object));
      expect(cdb.core.Loader).toBe(cdb.vis.Loader);

      expect(cdb.core.Profiler).toEqual(jasmine.any(Function));
      expect(cdb.core.util).toEqual(jasmine.any(Object));

      expect(cdb.Image).toEqual(jasmine.any(Function));
      expect(cdb.SQL).toEqual(jasmine.any(Function));

      expect(cdb.VERSION).toEqual(jasmine.any(String));
      expect(cdb.DEBUG).toEqual(jasmine.any(Boolean));
      expect(cdb.CARTOCSS_VERSIONS).toEqual(jasmine.any(Object));
      expect(cdb.CARTOCSS_DEFAULT_VERSION).toEqual(jasmine.any(String));
    });
  });
};
