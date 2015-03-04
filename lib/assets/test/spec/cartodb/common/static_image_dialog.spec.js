describe('StaticImageDialog', function() {

  describe('Regular', function() {

    var view, fakeSpy;

    beforeEach(function() {

      view = new cdb.admin.StaticImageDialog({
        vizjson: "fake_vizjson",
        attribution: "Attribution",
        width:  500,
        height: 300
      });

      view.render();

      fakeSpy = jasmine.createSpyObj('cdb', ['size', 'getUrl']);
      spyOn(cdb, "Image").and.returnValue(fakeSpy);
      fakeSpy.size.and.returnValue(fakeSpy);
      fakeSpy.getUrl.and.returnValue(fakeSpy);

    });

    it('should have no leaks', function() {
      view.$el.find(".ok").click();
      expect(view).toHaveNoLeaks();
    });

    it('should attempt to create an image', function() {
      view.$el.find(".ok").click();
      expect(cdb.Image).toHaveBeenCalled();
    });

    it('should request an image with default width and height', function() {
      view.$el.find(".ok").click();
      expect(fakeSpy.size.calls.argsFor(0)[0]).toEqual("500");
      expect(fakeSpy.size.calls.argsFor(0)[1]).toEqual("300");
    });

    it('should open a browser window', function(done) {
      spyOn(window, 'open');
      view.$el.find(".ok").click();
      var url = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      fakeSpy.getUrl.calls.argsFor(0)[0].call(view, null, url);

      setTimeout(function() {
        expect(window.open).toHaveBeenCalledWith(url, '_blank');
        done();
      }, 300)

    });

    it('should show an error', function(done) {
      view.$el.find(".ok").click();
      fakeSpy.getUrl.calls.argsFor(0)[0].call(view, { errors: ["error message"] });

      setTimeout(function() {
        expect(view.$el.find(".js-error-message").text()).toEqual("error message");
        done();
      }, 300);

    });

    afterEach(function() {
      view.clean();
    });

  });
});
