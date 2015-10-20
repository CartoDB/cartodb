describe("log", function() {

  it("should exist a global log", function() {
      expect(cdb.log).toBeTruthy();
  });

  it("should exist a global errorlist", function() {
      expect(cdb.errors).toBeTruthy();
  });


  describe("Log", function() {

    it("should has error, log and debug", function() {
      var log = new cdb.core.Log({tag: 'test'});
      expect(log.error).toBeTruthy();
      expect(log.debug).toBeTruthy();
      expect(log.log).toBeTruthy();
    });

    it("should generate error when error is called", function() {
      cdb.config.ERROR_TRACK_ENABLED = true
      cdb.errors.reset([]);
      var log = new cdb.core.Log({tag: 'test'});
      log.error('this is an error');
      expect(cdb.errors.size()).toEqual(1);
    });

  });

  describe("Error", function() {
    it("should set a browser info when created", function() {
      var err = new cdb.core.Error({});
      expect(err.get('browser')).toEqual(JSON.stringify($.browser));
    });
  });
});
